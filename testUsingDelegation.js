#!/usr/bin/env node
// this loads a capacity delegation signature from exampleDelegationSig.json and uses it to sign something with Lit

require("dotenv").config();
const { LitActionResource, LitAbility } = require("@lit-protocol/auth-helpers");
const LitJsSdk = require("@lit-protocol/lit-node-client");
const fs = require("fs");
const ethers = require("ethers");
const siwe = require("siwe");
const { getAuthSig } = require("./common");

async function main() {
  const userWallet = ethers.Wallet.createRandom();
  const walletAddress = await userWallet.getAddress();
  console.log("random userWallet address:", walletAddress);

  const capacityDelegationAuthSig = JSON.parse(
    fs.readFileSync("exampleDelegationSig.json")
  );

  const litNodeClient = new LitJsSdk.LitNodeClient({
    litNetwork: process.env.LIT_NETWORK,
    debug: false,
  });
  await litNodeClient.connect();

  const authNeededCallback = async ({ resources, expiration, uri }) => {
    const nonce = litNodeClient.getLatestBlockhash();
    // you can change this resource to anything you would like to specify
    const litResource = new LitActionResource("*");

    const recapObject =
      await litNodeClient.generateSessionCapabilityObjectWithWildcards([
        litResource,
      ]);

    recapObject.addCapabilityForResource(
      litResource,
      LitAbility.LitActionExecution
    );

    const verified = recapObject.verifyCapabilitiesForResource(
      litResource,
      LitAbility.LitActionExecution
    );

    if (!verified) {
      throw new Error("Failed to verify capabilities for resource");
    }

    let siweMessage = new siwe.SiweMessage({
      domain: "localhost:3000", // change to your domain ex: example.app.com
      address: walletAddress,
      statement: "Some custom statement.", // configure to what ever you would like
      uri,
      version: "1",
      chainId: "1",
      expirationTime: expiration,
      resources,
      nonce,
    });

    siweMessage = recapObject.addToSiweMessage(siweMessage);

    const messageToSign = siweMessage.prepareMessage();
    const signature = await userWallet.signMessage(messageToSign);

    const authSig = {
      sig: signature.replace("0x", ""),
      derivedVia: "web3.eth.personal.sign",
      signedMessage: messageToSign,
      address: walletAddress,
    };

    console.log("returning authSig:", JSON.stringify(authSig));

    return authSig;
  };

  let sessionSigs = await litNodeClient.getSessionSigs({
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    chain: "ethereum",
    resourceAbilityRequests: [
      {
        resource: new LitActionResource("*"),
        ability: LitAbility.LitActionExecution,
      },
    ],
    authNeededCallback,
    capacityDelegationAuthSig,
  });

  //   console.log("sessionSigs:", JSON.stringify(sessionSigs, null, 2));
  console.log(
    "Generated session sigs!  now you can use them to execute a lit action or for any other request to Lit."
  );

  // you can uncomment this, and then use it below, to show that the request would fail without the capacity delegation signature.  You should also comment out the "sessionSigs" line in the executeJs function.
  //   const authSig = await getAuthSig(userWallet);

  const results = await litNodeClient.executeJs({
    code: "LitActions.setResponse({response: JSON.stringify({hello: 'world'})})",
    sessionSigs,
    // authSig,
    jsParams: {},
  });
  console.log("response: ", results.response);

  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.log("main error handler triggered.  error below:");
  console.error(error);
  process.exitCode = 1;
  process.exit(1);
});

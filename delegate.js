#!/usr/bin/env node
// this is an example of how to delegate a capacity credit to a third party using a lit action.  You would run this code in the browser when your user starts a session.

require("dotenv").config();
const fs = require("fs");
const LitJsSdk = require("@lit-protocol/lit-node-client");
const { getAuthSig, getSigner } = require("./common");

async function main() {
  const wallet = getSigner();
  const authSig = await getAuthSig(wallet);
  // we don't use the code itself - we use the ipfs cid.  You could also pass the code, and it would still work, as long as you haven't changed bundled.js since you uploaded it to ipfs (which happens in ./mintPKP.js)
  //   const litActionCode = fs
  //     .readFileSync("./delegationAction/bundled.js")
  //     .toString();
  const pkpInfo = JSON.parse(fs.readFileSync("pkp.json"));
  const pkpWalletAddress = pkpInfo.pkp.ethAddress;
  const pkpPublicKey = pkpInfo.pkp.publicKey;
  const authorizedIpfsCid = pkpInfo.authorizedIpfsCid;

  const litNodeClient = new LitJsSdk.LitNodeClient({
    litNetwork: process.env.LIT_NETWORK,
    debug: false,
  });
  await litNodeClient.connect();
  const nonce = litNodeClient.getLatestBlockhash();

  const res = await litNodeClient.executeJs({
    // code: litActionCode,
    ipfsId: authorizedIpfsCid,
    authSig,
    jsParams: {
      // --- Required params
      pkpWalletAddress,
      pkpPublicKey,
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // the expiration time of the delegation signature.  This is 7 days from now.  You can set it up to 30 days.
      issuedAt: new Date().toISOString(), // the time the delegation signature was issued.  DefaShould be set to to now.,
      nonce: nonce.toString(), // the nonce from the latest blockhash.  This is used to prevent attacks where the issuedAt time is in the future

      // --- Optional params
      domain: "example.com", // the domain name in the delegation signature.  Defaults to "example.com".  This is only used in the SIWE message and has no real effect on anything.
      uses: 5, // how many times this delegation can be used
      // capacityTokenIds: ["0x1234"], // the capacity token ids to delegate.  If not provided, the delegation will be for all capacity tokens.  honestly you should probably omit this - tracking the capacity token ids is a pain.
      // delegateeAddresses: ["0x1234", "0x5678"], // an array of addresses to delegate to.  If not provided, the delegation will be for all addresses.  you could put your user's address in here, and then it would make it impossible for them to steal the delegation signature.  If you do this, you should check this against the credentials your user uses to auth inside toBundle.js
    },
  });

  console.log("res:", JSON.stringify(res, null, 2));

  let sig = res.signatures.delegationSig.signature.replace("0x", "");
  let messageToSign = res.response.messageToSign;

  const capacityDelegationAuthSig = {
    sig,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: messageToSign,
    address: pkpWalletAddress,
  };

  // you may now use the capacityDelegationAuthSig in the getSessionSigs() function for your user, which can be seen in the docs here: https://developer.litprotocol.com/v3/sdk/capacity-credits#generating-sessions-from-delegation-signature

  // for example:
  /*
   let sessionSigs = await litNodeClient.getSessionSigs({
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    chain: 'ethereum',
    resourceAbilityRequests: [
      {
        resource: new LitActionResource('*'),
        ability: LitAbility.LitActionExecution,
      },
    ],
    capacityDelegationAuthSig,
  });
  */

  // write example to file.  in real life, you would utilize this immediately in the getSessionSigs() function
  fs.writeFileSync(
    "exampleDelegationSig.json",
    JSON.stringify(capacityDelegationAuthSig, null, 2)
  );

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

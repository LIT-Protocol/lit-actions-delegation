const {
  LitRLIResource,
  RecapSessionCapabilityObject,
  LitAbility,
} = require("@lit-protocol/auth-helpers");
const siwe = require("siwe");

const go = async () => {
  // insert your logic here to check if the user is a valid user of your system.
  // You could use fetch() to check with your server if the user is valid.
  // Or you could check a chain to see if the user is valid.  If you're validating their wallet ownership, you would want to check a signature from their wallet.  Ethers v5 is injected into lit actions so you can easily check a signature - just use the "ethers" object as if you had already imported it.
  // This is totally up to you and just a placeholder for your own auth logic.
  const isAuthed = true;
  if (!isAuthed) {
    Lit.Actions.setResponse({
      response: "User is not authorized to receive a delegation",
    });
    return;
  }

  // -- default configuration for siwe message unless there are arguments
  const _domain =
    typeof domain !== "undefined" && domain ? domain : "example.com";
  const _statement = "I am delegating this Capacity Credit NFT";

  // -- default configuration for recap object capability
  const _uses = typeof uses !== "undefined" && uses ? uses : "1";

  // -- Strip the 0x prefix from each element in the addresses array if it exists
  if (
    typeof delegateeAddresses !== "undefined" &&
    delegateeAddresses &&
    delegateeAddresses.length > 0
  ) {
    delegateeAddresses = delegateeAddresses.map((address) =>
      address.startsWith("0x") ? address.slice(2) : address
    );
  }

  const litResource = new LitRLIResource(
    (typeof capacityTokenIds !== "undefined" && capacityTokenIds) ?? "*"
  );

  const recapObject = new RecapSessionCapabilityObject({}, []);

  const capabilities = {
    ...(typeof capacityTokenIds !== "undefined" && capacityTokenIds
      ? { nft_id: capacityTokenIds }
      : {}), // Conditionally include nft_id
    ...(typeof delegateeAddresses !== "undefined" && delegateeAddresses
      ? { delegate_to: delegateeAddresses }
      : {}),
    ...(typeof uses !== "undefined" && uses ? { uses: _uses.toString() } : {}),
  };

  recapObject.addCapabilityForResource(
    litResource,
    LitAbility.RateLimitIncreaseAuth,
    capabilities
  );

  // make sure that the resource is added to the recapObject
  const verified = recapObject.verifyCapabilitiesForResource(
    litResource,
    LitAbility.RateLimitIncreaseAuth
  );

  // -- validate
  if (!verified) {
    throw new Error("Failed to verify capabilities for resource");
  }

  // -- get auth sig
  let siweMessage = new siwe.SiweMessage({
    domain: _domain,
    address: pkpWalletAddress,
    statement: _statement,
    uri: "lit:capability:delegation",
    version: "1",
    chainId: 1,
    nonce: nonce,
    expirationTime: expiration,
    issuedAt: issuedAt,
  });

  siweMessage = recapObject.addToSiweMessage(siweMessage);

  let messageToSign = siweMessage.prepareMessage();

  await Lit.Actions.ethPersonalSignMessageEcdsa({
    message: messageToSign,
    publicKey: pkpPublicKey,
    sigName: "delegationSig",
  });

  Lit.Actions.setResponse({ response: JSON.stringify({ messageToSign }) });
};

go();

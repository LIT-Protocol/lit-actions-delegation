#!/usr/bin/env node
// this mints a PKP

require("dotenv").config();
const { LitContracts } = require("@lit-protocol/contracts-sdk");
const { AuthMethodScope, AuthMethodType } = require("@lit-protocol/constants");
const { getSigner, uploadLitAction } = require("./common");
const fs = require("fs");
const ethers = require("ethers");

async function main() {
  const { base58_to_binary, binary_to_base58 } = await import("base58-js");

  const signer = getSigner();

  const contractClient = new LitContracts({
    signer,
    network: process.env.LIT_NETWORK,
  });
  await contractClient.connect();

  const litActionCode = fs
    .readFileSync("./delegationAction/bundled.js")
    .toString();

  const uploadRes = await uploadLitAction({
    code: litActionCode,
    PINATA_API_KEY: process.env.PINATA_API_KEY,
    PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY,
  });
  console.log("uploadRes:", uploadRes);
  const ipfsCid = uploadRes.IpfsHash;
  const ipfsCidBytes = base58_to_binary(ipfsCid);

  // -- go
  const mintCost = await contractClient.pkpNftContract.read.mintCost();

  // -- start minting
  const tx =
    await contractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
      2, // key type
      [AuthMethodType.LitAction],
      [ipfsCidBytes],
      ["0x"],
      [[ethers.BigNumber.from(2)]], // eth_personalSign scope
      false,
      false,
      {
        value: mintCost,
      }
    );

  const receipt = await tx.wait();

  let events = "events" in receipt ? receipt.events : receipt.logs;

  if (!events) {
    throw new Error("No events found in receipt");
  }

  let tokenId;

  tokenId = events[0].topics[1];

  let publicKey = await contractClient.pkpNftContract.read.getPubkey(tokenId);

  if (publicKey.startsWith("0x")) {
    publicKey = publicKey.slice(2);
  }

  const pubkeyBuffer = Buffer.from(publicKey, "hex");

  const ethAddress = ethers.utils.computeAddress(pubkeyBuffer);

  const mintInfo = {
    authorizedIpfsCid: ipfsCid,
    pkp: {
      tokenId,
      publicKey,
      ethAddress,
    },
    tx: receipt,
  };

  fs.writeFileSync("pkp.json", JSON.stringify(mintInfo, null, 2));

  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.log("main error handler triggered.  error below:");
  console.error(error);
  process.exitCode = 1;
});

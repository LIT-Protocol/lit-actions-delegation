#!/usr/bin/env node
// this mints a Capacity Credit NFT

require("dotenv").config();
const { LitContracts } = require("@lit-protocol/contracts-sdk");
const { AuthMethodScope, AuthMethodType } = require("@lit-protocol/constants");
const { getSigner } = require("./common");
const fs = require("fs");

async function main() {
  const signer = getSigner();
  const walletAddress = await signer.getAddress();

  const pkpInfo = JSON.parse(fs.readFileSync("pkp.json"));
  const pkpWalletAddress = pkpInfo.pkp.ethAddress;

  const contractClient = new LitContracts({
    signer,
    network: process.env.LIT_NETWORK,
  });
  await contractClient.connect();

  // this identifier will be used in delegation requests.
  const { capacityTokenIdStr } = await contractClient.mintCapacityCreditsNFT({
    // requestsPerDay: 14400,
    requestsPerSecond: 10,
    daysUntilUTCMidnightExpiration: 30,
  });

  console.log("minted capacityTokenIdStr:", capacityTokenIdStr);

  // transfer to PKP wallet
  console.log(
    `Transferring capacity credit NFT from ${walletAddress} to PKP wallet ${pkpWalletAddress}. `
  );
  const transferTx =
    await contractClient.rateLimitNftContract.write.transferFrom(
      walletAddress,
      pkpWalletAddress,
      capacityTokenIdStr
    );
  const transferReceipt = await transferTx.wait();
  //   console.log("transferReceipt:", transferReceipt);
  console.log(
    "Transferred capacity credit NFT to PKP wallet.  capacityTokenIdStr:",
    capacityTokenIdStr
  );

  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.log("main error handler triggered.  error below:");
  console.error(error);
  process.exitCode = 1;
});

#!/usr/bin/env node
// this cleans the env of any generated files, so you can be sure you are starting from a clean slate.

require("dotenv").config();
const fs = require("fs");

async function main() {
  fs.rmSync("delegationAction/bundled.js", { force: true });
  fs.rmSync("pkp.json", { force: true });
  fs.rmSync("exampleDelegationSig.json", { force: true });
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

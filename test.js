#!/usr/bin/env node
// tests the whole flow, from scratch

const { execSync, exec } = require("node:child_process");

// first, clean the env of any generated files, so you can be sure you are starting from a clean slate.
console.log("Cleaning...");
execSync("./clean.js");

// 1. Write your auth logic lit action.
// this is an exercise left up to the reader.  see README.md for more information.

// 2. Bundle your auth logic lit action
console.log("2. Bundling...");
execSync("cd delegationAction && npm run bundle");

// 3. Mint a PKP that can sign using the lit action.
console.log("3. Minting PKP...");
execSync("./mintPKP.js");

// 4. Mint a Capacity Credit NFT
console.log("4. Minting capacity credit nft...");
execSync("./mintCC.js");

// 5. Create a delegation signature
console.log("5. Creating delegation signature...");
execSync("./delegate.js");

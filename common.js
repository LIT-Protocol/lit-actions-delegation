require("dotenv").config();
const ethers = require("ethers");
const siwe = require("siwe");
const pinataSDK = require("@pinata/sdk");
const { Readable } = require("stream");

function getSigner() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://chain-rpc.litprotocol.com/http"
  );
  const privateKey = process.env.LIT_ROLLUP_MAINNET_DEPLOYER_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  return wallet;
}

async function getAuthSig(wallet) {
  const address = await wallet.getAddress();

  // Craft the SIWE message
  const domain = "localhost";
  const origin = "https://localhost/login";
  const statement =
    "This is a test statement.  You can put anything you want here.";
  const siweMessage = new siwe.SiweMessage({
    domain,
    address: address,
    statement,
    uri: origin,
    version: "1",
    chainId: 1,
    expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  const messageToSign = siweMessage.prepareMessage();

  // Sign the message and format the authSig
  const signature = await wallet.signMessage(messageToSign);

  const authSig = {
    sig: signature,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: messageToSign,
    address: address,
  };

  return authSig;
}

async function uploadLitAction({ code, PINATA_API_KEY, PINATA_SECRET_KEY }) {
  const pinata = new pinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);
  const buffer = Buffer.from(code, "utf8");
  const stream = Readable.from(buffer);

  stream.path = "string.txt";

  const res = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: "string.txt" },
  });
  return res;
}

module.exports = { getSigner, getAuthSig, uploadLitAction };

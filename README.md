# Demo of a Lit Action that delegates capacity credit NFTs

## Setup

Run `npm install` first. Then copy `.env.sample` to `.env` and fill in a private key for a wallet with LIT tokens on Chronicle. You can get tokens from the faucet at https://faucet.litprotocol.com or get in contact with the Lit team if you need more.

## 1. Write your auth logic lit action.

Open `delegationAction/toBundle.js`. At the top, you will see some comments that say "insert your logic here to check if the user is a valid user of your system".

This logic will check that the user trying to get a capacity delegation signature is indeed a valid user of your service.

You could use fetch() to check with your server if the user is valid. Or you could check a chain to see if the user is valid. If you're validating their wallet ownership, you would want to check a signature from their wallet. Ethers v5 is injected into lit actions so you can easily check a signature - just use the "ethers" object as if you had already imported it.

If this is confusing, please reach out to the Lit Team and we can explain further.

## 2. Bundle your auth logic lit action

In the `delegationAction` folder, run `npm i` to install the packages. Then, run `npm run bundle` which should create the file `bundled.js`

## 3. Mint a PKP that can sign using the lit action.

You need to mint a PKP that will hold your capacity credit NFTs. Run `./mintPKP.js` to do this. This will create a local file, `pkp.json`, which holds your PKP info. This PKP will actually create the capacity delegation signature for your users.

This will also upload your `bundled.js` file to pinata, and set it up so that the corresponding Lit Action is allowed to use the PKP to sign. `pkp.json` contains a field, `authorizedIpfsCid` that is your IPFS CID. You will need this later in your delegation code, but it will be automatically loaded when you're using this project.

## 4. Mint a capacity credit NFT

Next run `./mintCC.js` to mint a capacity credit NFT. This NFT will be sent to the eth address in pkp.json. Now your PKP has a capacity credit NFT and can delegate it to your users. Note that you may want to change the `requestsPerSecond` parameter to whatever you think you'll need.

## 5. Create a delegation signature

Run `./delegate.js` to create a delegation signature. This code would be run inside your app, and the signature would be returned. For this example, the signature is written to exampleDelegationSig.json. In real life, you could use the capacityDelegationAuthSig in the getSessionSigs() function for your user, which can be seen in the docs here: https://developer.litprotocol.com/v3/sdk/capacity-credits#generating-sessions-from-delegation-signature

for example:

```
let sessionSigs = await litNodeClient.getSessionSigs({
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    chain: 'ethereum',
    resourceAbilityRequests: [{
        resource: new LitActionResource('*'),
        ability: LitAbility.LitActionExecution,
    }, ],
    capacityDelegationAuthSig,
});
```

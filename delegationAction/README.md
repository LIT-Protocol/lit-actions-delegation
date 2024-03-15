This example shows how to bundle up the code to do a capacity credit delegation.

```
npm run bundle
```

This will bundle toBundle.js into bundled.js.

This example shows how you can create a bundle with esbuild to run in a Lit Action, and use the ethers package provided by the Lit Nodes, which you can see is defined in esbuild-shims.js

You can also use SIWE by creating the message to be signed on the client side, and then sending the message to the Lit Node to sign. You can see an example of this in the js-sdkTests/siwe.js file which can be run using `yarn run sideClientSide`.

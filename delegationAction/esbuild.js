const { build } = require("esbuild");
const { polyfillNode } = require("esbuild-plugin-polyfill-node");

const main = async () => {
  let result = await build({
    entryPoints: ["./toBundle.js"],
    bundle: true,
    minify: false,
    sourcemap: false,
    outfile: "./bundled.js",
    sourceRoot: "./",
    platform: "node",
    metafile: true,
    external: ["ethers"],
    inject: ["./esbuild-shims.js"],
    plugins: [
      polyfillNode({
        // Options (optional)
        globals: {
          process: false,
          __dirname: false,
          __filename: false,
        },
      }),
    ],
  });
  // let text = await analyzeMetafile(result.metafile);
  // console.log(text);
  process.exit(0);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.log("main error handler triggered.  error below:");
  console.error(error);
  process.exitCode = 1;
});

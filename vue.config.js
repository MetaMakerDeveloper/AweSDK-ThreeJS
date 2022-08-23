const { defineConfig } = require("@vue/cli-service");

const path = require("path");

if (process.env.VUE_BUILD_APP == "mlib") {
  module.exports = require("./vue.config.lib");
} else {
  module.exports = defineConfig({
    transpileDependencies: true,
    pages: {
      index: "./examples/example.ts",
    },
    configureWebpack: (config) => {
      const wasmExtensionRegExp = /\.wasm$/;
      // config.module.rules.push({
      //   test: /\.worker\.js$/, // 以.worker.js结尾的文件将被worker-loader加载
      //   use: { loader: "worker-loader" },
      // });
      config.devtool = "source-map";

      config.resolve.extensions.push(".wasm");

      config.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
            // make file-loader ignore WASM files

            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      config.module.rules.push({
        test: wasmExtensionRegExp,
        include: path.resolve(__dirname, "src"),

        use: [{ loader: require.resolve("wasm-loader"), options: {} }],
      });
    },
  });
}
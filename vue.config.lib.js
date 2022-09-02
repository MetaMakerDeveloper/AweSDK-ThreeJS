const { defineConfig } = require("@vue/cli-service");

const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  outputDir: "./libs",
  configureWebpack: (config) => {
    config.entry = "./src/lib/index.ts";
    const wasmExtensionRegExp = /\.wasm$/;
    config.devtool = false;

    config.resolve.extensions.push(".wasm");
    config.module.rules.forEach((rule) => {
      (rule.oneOf || []).forEach((oneOf) => {
        if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
          oneOf.exclude.push(wasmExtensionRegExp);
        }
      });
    });
    config.module.rules.forEach((rule) => {
      if (rule.__ruleNames[0] == "images") {
        rule.type = "asset/inline";
        rule.parser = { dataUrlCondition: { maxSize: 1024 * 412 } };
        delete rule.generator;
      }
    });
    config.module.rules.push({
      test: wasmExtensionRegExp,
      include: path.resolve(__dirname, "src"),
      use: [{ loader: require.resolve("wasm-loader"), options: {} }],
    });

    config.output.filename = "metamaker-for-three.js";
    config.output.library = {
      root: "_MMFT",
      amd: "_MMFT",
      commonjs: "_MMFT",
    };
    config.output.libraryExport = "default";
    config.output.libraryTarget = "umd";
    config.externals = {
      three: {
        root: "THREE",
        amd: "three",
        commonjs2: "three",
        commonjs: "three",
      },
    };
    delete config.optimization.splitChunks;
    config.plugins = config.plugins.filter((plugin) => {
      return (
        plugin.__pluginConstructorName != "HtmlWebpackPlugin" &&
        plugin.__pluginConstructorName != "CopyPlugin"
      );
    });
  },
});

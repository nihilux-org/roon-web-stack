const path = require('path');
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const isProduction = process.env.NODE_ENV !== "development";

const config = {
  entry: "./src/index.ts",
  target: "es2022",
  output: {
    path: path.resolve(__dirname, "bin"),
    filename: "roon-web-client.js",
    library: {
      type: "module",
    },
    module: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: require.resolve("ts-loader"),
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts"],
    plugins: [new TsconfigPathsPlugin({})],
  },
  experiments: {
    outputModule: true,
  },
};

module.exports = () => {
    if (isProduction) {
      config.mode = "production";
      config.devtool = "source-map";
    } else {
      config.mode = "development";
      config.devtool = "inline-source-map"
    }
    return config;
};

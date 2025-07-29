const path = require("path");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const NodemonPlugin = require("nodemon-webpack-plugin");

const isProduction = process.env.NODE_ENV !== "development";

const config = {
  entry: "./src/app.ts",
  target: "node",
  output: {
    path: path.resolve(__dirname, "bin"),
    filename: "app.js",
  },
  plugins: [ new NodemonPlugin() ],
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
  externals: [nodeExternals()],
  externalsPresets: {
    node: true
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

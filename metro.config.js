const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes("db")) {
  config.resolver.assetExts.push("db");
}

module.exports = withNativeWind(config, { input: "./global.css" });

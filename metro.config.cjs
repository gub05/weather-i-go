// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This is the important part
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@google/earthengine') {
    // Force the resolver to use the server-side build of the library
    return context.resolveRequest(context, '@google/earthengine/build/server', platform);
  }
  // Let the default resolver handle everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver for native modules and CSS
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@google/earthengine') {
    // Force the resolver to use the server-side build of the library
    return context.resolveRequest(context, '@google/earthengine/build/server', platform);
  }
  
  // Handle lightningcss native module issues
  if (moduleName.includes('lightningcss') && moduleName.includes('.node')) {
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      // If native module can't be resolved, skip it for web platform
      if (platform === 'web') {
        return { type: 'empty' };
      }
      throw error;
    }
  }
  
  // Exclude react-native-maps and native modules from web builds
  if (platform === 'web') {
    if (moduleName.startsWith('react-native-maps') ||
        moduleName.includes('react-native/Libraries/Utilities/codegenNativeCommands')) {
      return { type: 'empty' };
    }
  }
  
  // Let the default resolver handle everything else
  return context.resolveRequest(context, moduleName, platform);
};

// Ensure CSS modules work properly
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;
// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Simplified resolver configuration for better Android performance
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle web-specific exclusions only
  if (platform === 'web') {
    if (moduleName.startsWith('react-native-maps') ||
        moduleName.includes('react-native/Libraries/Utilities/codegenNativeCommands')) {
      return { type: 'empty' };
    }
    
    // Handle lightningcss native module issues on web
    if (moduleName.includes('lightningcss') && moduleName.includes('.node')) {
      return { type: 'empty' };
    }
  }
  
  // Let the default resolver handle everything else
  return context.resolveRequest(context, moduleName, platform);
};

// Optimize for Android performance
config.resolver.platforms = ['ios', 'android', 'web'];

// Android-specific optimizations
config.transformer = {
  ...config.transformer,
  // Reduce bundle size for Android
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_keys: true,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    warnings: false,
  },
};

// Load environment variables
require('dotenv').config();

module.exports = config;
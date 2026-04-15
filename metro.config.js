const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('lottie');
config.resolver.assetExts.push('riv');

// MapLibre v11 ships an ESM lib/module build that Metro resolves via package exports.
// The ESM build uses import/export syntax that Metro can't process directly, causing
// "Unable to resolve module" errors. Force Metro to the commonjs build instead.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@maplibre/maplibre-react-native') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@maplibre/maplibre-react-native/lib/commonjs/index.js',
      ),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});

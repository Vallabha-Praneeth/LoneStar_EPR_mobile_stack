import type { ConfigPlugin } from '@expo/config-plugins';
import { withAppBuildGradle } from '@expo/config-plugins';

const MARKER = '// keystore-loader: injected by ./plugins/with-keystore-loader';

const KEYSTORE_LOADER_BLOCK = `${MARKER}
def keystorePropertiesFile = rootProject.file("../secrets/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`;

const SIGNING_CONFIGS_DEFAULT = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const SIGNING_CONFIGS_PATCHED = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        if (keystoreProperties['storeFile']) {
            release {
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }`;

const BUILD_TYPES_RELEASE_DEFAULT = `            signingConfig signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'`;

const BUILD_TYPES_RELEASE_PATCHED = `            signingConfig keystoreProperties['storeFile'] ? signingConfigs.release : signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'`;

const ANDROID_BLOCK_ANCHOR = '\nandroid {';

const withKeystoreLoader: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        '[with-keystore-loader] only Groovy android/app/build.gradle is supported',
      );
    }

    let contents = cfg.modResults.contents;

    if (contents.includes(MARKER)) {
      return cfg;
    }

    if (!contents.includes(ANDROID_BLOCK_ANCHOR)) {
      throw new Error(
        '[with-keystore-loader] could not find `android {` block anchor in android/app/build.gradle',
      );
    }
    contents = contents.replace(
      ANDROID_BLOCK_ANCHOR,
      `\n${KEYSTORE_LOADER_BLOCK}\nandroid {`,
    );

    if (!contents.includes(SIGNING_CONFIGS_DEFAULT)) {
      throw new Error(
        '[with-keystore-loader] default signingConfigs block not found; template may have shifted',
      );
    }
    contents = contents.replace(SIGNING_CONFIGS_DEFAULT, SIGNING_CONFIGS_PATCHED);

    if (!contents.includes(BUILD_TYPES_RELEASE_DEFAULT)) {
      throw new Error(
        '[with-keystore-loader] default buildTypes.release signingConfig anchor not found',
      );
    }
    contents = contents.replace(
      BUILD_TYPES_RELEASE_DEFAULT,
      BUILD_TYPES_RELEASE_PATCHED,
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
};

export default withKeystoreLoader;

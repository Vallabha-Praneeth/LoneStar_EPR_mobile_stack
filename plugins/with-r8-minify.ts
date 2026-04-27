import type { ConfigPlugin } from '@expo/config-plugins';
import { withGradleProperties } from '@expo/config-plugins';

/**
 * Enables R8 code shrinking for release builds via
 * `android.enableMinifyInReleaseBuilds=true` in android/gradle.properties.
 *
 * Why: without minify, R8 doesn't generate a `mapping.txt` for crash
 * deobfuscation, and Play Console flags every release with a "missing
 * deobfuscation file" warning. Enabling minify also reduces APK size.
 *
 * The existing proguard-rules.pro keeps reanimated + turbomodule classes,
 * which are the only RN-specific reflection users we have. Standard RN +
 * Expo libs ship their own consumer ProGuard rules.
 *
 * CI: irrelevant — debug builds skip this property entirely.
 */
const PROPERTY_KEY = 'android.enableMinifyInReleaseBuilds';

const withR8Minify: ConfigPlugin = (config) => {
  return withGradleProperties(config, (cfg) => {
    const existing = cfg.modResults.find(
      item => item.type === 'property' && item.key === PROPERTY_KEY,
    );

    if (existing) {
      (existing as { type: string; key: string; value: string }).value = 'true';
    }
    else {
      cfg.modResults.push({
        type: 'property',
        key: PROPERTY_KEY,
        value: 'true',
      });
    }

    return cfg;
  });
};

export default withR8Minify;

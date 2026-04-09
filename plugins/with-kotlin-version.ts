import type { ConfigPlugin } from '@expo/config-plugins';
import { withProjectBuildGradle } from '@expo/config-plugins';

/**
 * Pins kotlinVersion in the root build.gradle ext block so that
 * lottie-react-native (and other libs with stale fallbacks) use the same
 * Kotlin version as expo-modules-core (2.0.21) instead of their own
 * outdated defaults (e.g. 1.7.10 from lottie 7.x).
 *
 * Without this, the Gradle build fails when New Architecture is enabled.
 */
const withKotlinVersion: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (cfg) => {
    const { contents } = cfg.modResults;

    // Only inject once — idempotent
    if (contents.includes('ext { kotlinVersion')) {
      return cfg;
    }

    // Insert the ext block right after the opening of the buildscript block
    cfg.modResults.contents = contents.replace(
      '// Top-level build file where you can add configuration options common to all sub-projects/modules.',
      [
        '// Top-level build file where you can add configuration options common to all sub-projects/modules.',
        '',
        '// Pin Kotlin version so lottie-react-native and other libs share the same',
        '// version as expo-modules-core, preventing Gradle failures with New Architecture.',
        'ext { kotlinVersion = "2.0.21" }',
      ].join('\n'),
    );

    return cfg;
  });
};

export default withKotlinVersion;

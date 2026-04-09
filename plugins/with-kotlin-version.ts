import type { ConfigPlugin } from '@expo/config-plugins';
import { withGradleProperties } from '@expo/config-plugins';

/**
 * Pins kotlinVersion in android/gradle.properties so that lottie-react-native
 * (and other libs that check project.properties in their buildscript blocks)
 * use Kotlin 2.0.21 instead of their stale fallbacks (e.g. lottie 7.x → 1.7.10).
 *
 * Why gradle.properties and NOT build.gradle ext {}?
 * Gradle's buildscript classpath is resolved during the *initialization* phase,
 * before ext properties are evaluated. gradle.properties values (project.properties)
 * ARE available during initialization, so this is the correct place to set it.
 *
 * Without this, expo-modules-core (Kotlin 2.0.21) and lottie (Kotlin 1.7.10)
 * clash under New Architecture, causing a Gradle build failure.
 */
const withKotlinVersion: ConfigPlugin = (config) => {
  return withGradleProperties(config, (cfg) => {
    const existing = cfg.modResults.find(
      item => item.type === 'property' && item.key === 'kotlinVersion',
    );

    if (existing) {
      // Already set — update to ensure correct value
      (existing as { type: string; key: string; value: string }).value = '2.0.21';
    }
    else {
      cfg.modResults.push({
        type: 'property',
        key: 'kotlinVersion',
        value: '2.0.21',
      });
    }

    return cfg;
  });
};

export default withKotlinVersion;

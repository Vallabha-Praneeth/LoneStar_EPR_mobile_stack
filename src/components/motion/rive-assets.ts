/**
 * Central Rive animation asset registry.
 * Keep all require() calls here — one place to update paths.
 */
export const riveAssets = {
  movingTruck: require('../../../assets/animations/moving-truck.riv'),
  loginCharacter: require('../../../assets/animations/animated-login-character.riv'),
  checkmark: require('../../../assets/animations/checkmark.riv'),
  spinner: require('../../../assets/animations/spinner.riv'),
  juice: require('../../../assets/animations/juice.riv'),
} as const;

export type RiveAssetKey = keyof typeof riveAssets;

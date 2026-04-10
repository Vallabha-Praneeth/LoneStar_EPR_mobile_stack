/**
 * Central Rive animation asset registry.
 * Keep all require() calls here — one place to update paths.
 */
export const riveAssets = {
  // Driver
  movingTruck: require('../../../assets/animations/moving-truck.riv'),
  loginCharacter: require('../../../assets/animations/animated-login-character.riv'),
  checkmark: require('../../../assets/animations/checkmark.riv'),
  spinner: require('../../../assets/animations/spinner.riv'),
  juice: require('../../../assets/animations/juice.riv'),
  // Admin
  dashboardHero: require('../../../assets/animations/dashboard-hero.riv'),
  campaignProgress: require('../../../assets/animations/campaign-progress.riv'),
  campaignMilestone: require('../../../assets/animations/campaign-milestone.riv'),
  approveUnlock: require('../../../assets/animations/approve-unlock.riv'),
  campaignCreated: require('../../../assets/animations/campaign-created.riv'),
  statusIcon: require('../../../assets/animations/status-icon.riv'),
  budgetIndicator: require('../../../assets/animations/budget-indicator.riv'),
  iconSet: require('../../../assets/animations/icon-set.riv'),
  listPagination: require('../../../assets/animations/list-pagination.riv'),
  // Client
  photoGalleryHover: require('../../../assets/animations/photo-gallery-hover.riv'),
} as const;

export type RiveAssetKey = keyof typeof riveAssets;

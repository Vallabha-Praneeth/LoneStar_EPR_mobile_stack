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
  // Controls
  buttonAnimation: require('../../../assets/animations/button-animation.riv'),
  toggleSwitch: require('../../../assets/animations/toggle-switch.riv'),
  unlock: require('../../../assets/animations/unlock.riv'),
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
  campaignFill: require('../../../assets/animations/campaign-fill.riv'),
  welcomeCharacter: require('../../../assets/animations/welcome-character.riv'),
  // Phase 1 — analytics
  skycoins: require('../../../assets/animations/skycoins.riv'),
  // Phase 2 — global UX
  brandLogo: require('../../../assets/animations/logo-chrome.riv'),
  backArrow: require('../../../assets/animations/back-arrow.riv'),
  shiftStart: require('../../../assets/animations/shift-start.riv'),
  offline: require('../../../assets/animations/offline.riv'),
  logoutIcon: require('../../../assets/animations/logout-icon.riv'),
} as const;

export type RiveAssetKey = keyof typeof riveAssets;

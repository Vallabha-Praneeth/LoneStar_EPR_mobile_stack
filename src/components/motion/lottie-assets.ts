/**
 * Central animation source registry.
 * Keep all local `require()` references in one place.
 */
export const lottieAssets = {
  uploadProgress: require('../../../assets/animations/upload-batch.lottie'),
  uploadSuccess: require('../../../assets/animations/success-check.lottie'),
  adminEmptySearch: require('../../../assets/animations/admin-empty-search.lottie'),
  clientEmptyBox: require('../../../assets/animations/client-empty-box.lottie'),
  analyticsCharacter: require('../../../assets/animations/analytics-character.lottie'),
  chartDiagram: require('../../../assets/animations/chart-diagram.lottie'),
  businessDeal: require('../../../assets/animations/business-deal.lottie'),
  filterDrill: require('../../../assets/animations/filter-drill.lottie'),
  dataAnalyticsAndResearch: require('../../../assets/animations/data-analytics-and-research-050hLTRnUw.lottie'),
  dataExtraction: require('../../../assets/animations/data-extraction-FJzauggnRA.lottie'),
  driverAnalyticsHero: require('../../../assets/animations/driver-analytics-hero.lottie'),
  clientAnalyticsHero: require('../../../assets/animations/client-analytics-hero.lottie'),
} as const;

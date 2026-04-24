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
  chartDiagramBurst: require('../../../assets/animations/chart-diagram-hreI9ZgxO4.lottie'),
  assistantBot: require('../../../assets/animations/assistant-bot-uWPqtngsUq.lottie'),
  presentationWorkActivity: require('../../../assets/animations/presentation-work-activity-w2Cv8g5C9Z.lottie'),
  businessDeal: require('../../../assets/animations/business-deal.lottie'),
  filterDrill: require('../../../assets/animations/filter-drill.lottie'),
  dataAnalyticsAndResearch: require('../../../assets/animations/data-analytics-and-research-050hLTRnUw.lottie'),
  dataExtraction: require('../../../assets/animations/data-extraction-FJzauggnRA.lottie'),
  advancedAnalytics: require('../../../assets/animations/advanced-analytics-uYDxJcLFVe.lottie'),
  dashboardBi: require('../../../assets/animations/dashboard-bi-gRjqB7VR20.lottie'),
  driverAnalyticsHero: require('../../../assets/animations/driver-analytics-hero.lottie'),
  clientAnalyticsHero: require('../../../assets/animations/client-analytics-hero.lottie'),
} as const;

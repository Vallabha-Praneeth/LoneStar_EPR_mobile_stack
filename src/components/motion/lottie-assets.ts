/**
 * Central animation source registry.
 * Keep all local `require()` references in one place.
 */
export const lottieAssets = {
  uploadProgress: require('../../../assets/animations/upload-batch.lottie'),
  uploadSuccess: require('../../../assets/animations/success-check.lottie'),
  adminEmptySearch: require('../../../assets/animations/admin-empty-search.lottie'),
  clientEmptyBox: require('../../../assets/animations/client-empty-box.lottie'),
} as const;

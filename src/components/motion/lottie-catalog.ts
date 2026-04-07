export type LottieCatalogItem = {
  key: 'upload-progress' | 'upload-success';
  useCase: string;
  /**
   * Repo-relative path where the animation should live.
   * Keep this as metadata until the binary files are added.
   */
  assetPath: string;
};

export const lottieCatalog: Record<LottieCatalogItem['key'], LottieCatalogItem> = {
  'upload-progress': {
    key: 'upload-progress',
    useCase: 'Driver photo upload progress',
    assetPath: 'assets/animations/upload-batch.lottie',
  },
  'upload-success': {
    key: 'upload-success',
    useCase: 'Driver photo upload success confirmation',
    assetPath: 'assets/animations/success-check.lottie',
  },
};

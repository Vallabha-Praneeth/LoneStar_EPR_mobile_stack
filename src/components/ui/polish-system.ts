import type { ViewStyle } from 'react-native';

export const uiPolishClasses = {
  screenBg: 'flex-1 bg-neutral-50 dark:bg-neutral-900',
  headerShell: 'border-b border-neutral-200 bg-white px-4 pb-3 dark:border-neutral-700 dark:bg-neutral-800',
  headerIconButton: 'size-9 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700',
  sectionWrap: 'px-4 pt-3',
} as const;

export const uiPolishSpacing = {
  screenPadding: 16,
  sectionGap: 12,
  modalSectionGap: 16,
} as const;

export const uiPolishStyles = {
  listContent: {
    padding: uiPolishSpacing.screenPadding,
    gap: uiPolishSpacing.sectionGap,
  } satisfies ViewStyle,
  modalListContent: {
    paddingHorizontal: uiPolishSpacing.screenPadding,
    paddingBottom: 24,
    gap: uiPolishSpacing.modalSectionGap,
  } satisfies ViewStyle,
} as const;

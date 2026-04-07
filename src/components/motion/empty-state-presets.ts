import { motionTokens } from '@/lib/motion/tokens';

export const emptyStatePresets = {
  adminCampaignList: {
    size: 72,
    entranceDurationMs: motionTokens.duration.fast,
    entranceOffsetY: 6,
  },
  adminReports: {
    size: 84,
    entranceDurationMs: motionTokens.duration.base,
    entranceOffsetY: 8,
  },
  adminAnalytics: {
    size: 96,
    entranceDurationMs: motionTokens.duration.reveal,
    entranceOffsetY: 10,
  },
  clientReportsInfo: {
    size: 92,
    className: 'py-2',
    entranceDurationMs: motionTokens.duration.reveal,
    entranceOffsetY: 10,
  },
} as const;

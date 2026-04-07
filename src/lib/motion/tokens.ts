export const motionTokens = {
  duration: {
    instant: 100,
    fast: 200,
    base: 350,
    reveal: 500,
    celebration: 800,
  },
  spring: {
    lively: {
      type: 'spring' as const,
      damping: 14,
      stiffness: 220,
    },
    gentle: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 180,
    },
  },
} as const;

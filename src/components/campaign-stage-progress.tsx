import * as React from 'react';

import { Text, View } from '@/components/ui';

type CampaignStatus = 'draft' | 'pending' | 'active' | 'completed' | 'overdue';

const STAGES: { key: CampaignStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'overdue', label: 'Overdue' },
];

type Props = {
  status: string;
};

/**
 * Campaign stage progress — Rive decorative bar + 4-step indicator.
 * The Rive animation plays as a visual accent; the step row communicates exact stage.
 */
export function CampaignStageProgress({ status }: Props) {
  const currentIdx = STAGES.findIndex(s => s.key === status);
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <View className="gap-3">
      {/* Step indicator */}
      <View className="px-1">
        {/* Circles + connectors */}
        <View className="flex-row items-center">
          {STAGES.map((stage, i) => {
            const isDone = i <= safeIdx;
            const isCurrent = i === safeIdx;
            return (
              <React.Fragment key={stage.key}>
                {i > 0 && (
                  <View
                    className={`h-0.5 flex-1 ${i <= safeIdx ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                  />
                )}
                <View
                  className={[
                    'rounded-full',
                    isCurrent
                      ? 'size-5 border-2 border-primary-500 bg-primary-100 dark:bg-primary-900'
                      : isDone
                        ? 'size-4 bg-primary-500'
                        : 'size-4 bg-neutral-200 dark:bg-neutral-700',
                  ].join(' ')}
                />
              </React.Fragment>
            );
          })}
        </View>

        {/* Labels — justify-between so they span the full row */}
        <View className="mt-2 flex-row justify-between">
          {STAGES.map((stage, i) => {
            const isCurrent = i === safeIdx;
            const isPast = i < safeIdx;
            return (
              <Text
                key={stage.key}
                className={[
                  'text-xs',
                  isCurrent
                    ? 'font-bold text-primary-600 dark:text-primary-400'
                    : isPast
                      ? 'text-neutral-500 dark:text-neutral-400'
                      : 'text-neutral-400 dark:text-neutral-600',
                ].join(' ')}
              >
                {stage.label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

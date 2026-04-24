export type CampaignLifecycleStatus = 'draft' | 'pending' | 'active' | 'completed' | 'overdue';

type ShiftLike = {
  started_at?: string | null;
  ended_at?: string | null;
};

type DeriveCampaignStatusInput = {
  campaignDate: string;
  rawStatus: string;
  shifts?: ShiftLike[] | null;
  now?: Date;
};

function localDayStart(campaignDate: string): Date {
  return new Date(`${campaignDate}T00:00:00`);
}

function localDayEnd(campaignDate: string): Date {
  return new Date(`${campaignDate}T23:59:59.999`);
}

export function deriveCampaignStatus({
  campaignDate,
  rawStatus,
  shifts = [],
  now = new Date(),
}: DeriveCampaignStatusInput): CampaignLifecycleStatus {
  const normalized = rawStatus.trim().toLowerCase();
  const shiftRows = shifts ?? [];
  const hasOpenShift = shiftRows.some(shift => !!shift.started_at && !shift.ended_at);
  const hasCompletedShift = shiftRows.some(shift => !!shift.ended_at);

  if (normalized === 'draft') {
    return 'draft';
  }
  if (normalized === 'completed') {
    return 'completed';
  }
  if (hasOpenShift) {
    return 'active';
  }
  if (now < localDayStart(campaignDate)) {
    return 'pending';
  }
  if (hasCompletedShift) {
    return 'completed';
  }
  if (now > localDayEnd(campaignDate)) {
    return 'overdue';
  }
  return 'pending';
}

import { Badge } from '@/components/ui';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  draft: 'default',
  pending: 'warning',
  active: 'success',
  completed: 'default',
  overdue: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const variant = STATUS_VARIANT[normalized] ?? 'default';

  return (
    <Badge
      label={status}
      variant={variant}
      labelClassName="capitalize"
    />
  );
}

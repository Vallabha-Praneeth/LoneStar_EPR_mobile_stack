import { Text, View } from '@/components/ui';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 dark:bg-gray-700',
  pending: 'bg-yellow-100 dark:bg-yellow-900',
  active: 'bg-green-100 dark:bg-green-900',
  completed: 'bg-blue-100 dark:bg-blue-900',
  approved: 'bg-green-100 dark:bg-green-900',
  rejected: 'bg-red-100 dark:bg-red-900',
};

const TEXT_STYLES: Record<string, string> = {
  draft: 'text-gray-600 dark:text-gray-300',
  pending: 'text-yellow-700 dark:text-yellow-300',
  active: 'text-green-700 dark:text-green-300',
  completed: 'text-blue-700 dark:text-blue-300',
  approved: 'text-green-700 dark:text-green-300',
  rejected: 'text-red-700 dark:text-red-300',
};

export function StatusBadge({ status }: { status: string }) {
  const bg = STATUS_STYLES[status] ?? 'bg-gray-100';
  const text = TEXT_STYLES[status] ?? 'text-gray-600';

  return (
    <View className={`rounded-full px-2 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium capitalize ${text}`}>
        {status}
      </Text>
    </View>
  );
}

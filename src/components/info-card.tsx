import { Text, View } from '@/components/ui';

type InfoCardProps = {
  icon: string;
  label: string;
  value: string;
};

export function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <View className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <View className="mb-1 flex-row items-center gap-2">
        <Text className="text-sm">{icon}</Text>
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
      <Text className="font-semibold">{value}</Text>
    </View>
  );
}

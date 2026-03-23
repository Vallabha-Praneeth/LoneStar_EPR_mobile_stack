import { TextInput } from 'react-native';

import { View } from '@/components/ui';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <View className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        style={{ fontSize: 16 }}
        className="text-gray-900 dark:text-white"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

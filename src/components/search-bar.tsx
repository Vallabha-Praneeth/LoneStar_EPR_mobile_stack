import { TextInput, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { Search } from '@/components/ui/icons';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
      <Search color="#a3a3a3" width={16} height={16} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        style={{ fontSize: 16, flex: 1 }}
        className="text-neutral-900 dark:text-white"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-sm text-neutral-400">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

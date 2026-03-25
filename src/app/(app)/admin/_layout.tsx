import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Text } from '@/components/ui';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text className={`text-xs ${focused ? 'font-semibold text-primary' : 'text-gray-500'}`}>
      {label}
    </Text>
  );
}

export default function AdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="campaigns"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Campaigns" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Create" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Reports" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Users" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

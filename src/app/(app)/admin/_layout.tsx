import { Tabs } from 'expo-router';
import * as React from 'react';
import { Platform } from 'react-native';

import { Text, View } from '@/components/ui';
import { BarChart, Clipboard, Plus, Users } from '@/components/ui/icons';

type TabItemProps = {
  label: string;
  focused: boolean;
  icon: React.ReactNode;
};

function TabItem({ label, focused, icon }: TabItemProps) {
  return (
    <View className="items-center gap-1">
      {icon}
      <Text className={`text-[10px] ${focused ? 'font-semibold text-primary' : 'text-neutral-400'}`}>
        {label}
      </Text>
    </View>
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
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Campaigns"
              focused={focused}
              icon={<Clipboard color={focused ? '#1d4ed8' : '#a3a3a3'} width={20} height={20} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Create"
              focused={focused}
              icon={<Plus color={focused ? '#1d4ed8' : '#a3a3a3'} width={20} height={20} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Reports"
              focused={focused}
              icon={<BarChart color={focused ? '#1d4ed8' : '#a3a3a3'} width={20} height={20} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Users"
              focused={focused}
              icon={<Users color={focused ? '#1d4ed8' : '#a3a3a3'} width={20} height={20} />}
            />
          ),
        }}
      />
    </Tabs>
  );
}

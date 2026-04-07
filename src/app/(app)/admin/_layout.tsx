import { Tabs } from 'expo-router';
import * as React from 'react';
import { Platform } from 'react-native';

import { BarChart, Clipboard, MapPin, Plus, Users } from '@/components/ui/icons';

const ACTIVE = '#1d4ed8';
const INACTIVE = '#a3a3a3';

export default function AdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
      }}
    >
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          tabBarIcon: ({ focused }) => (
            <Clipboard color={focused ? ACTIVE : INACTIVE} width={20} height={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => (
            <Plus color={focused ? ACTIVE : INACTIVE} width={20} height={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => (
            <BarChart color={focused ? ACTIVE : INACTIVE} width={20} height={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused }) => (
            <Users color={focused ? ACTIVE : INACTIVE} width={20} height={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ focused }) => (
            <MapPin color={focused ? ACTIVE : INACTIVE} width={20} height={20} />
          ),
        }}
      />
      <Tabs.Screen name="cost-types" options={{ href: null }} />
      <Tabs.Screen name="route-form" options={{ href: null }} />
      <Tabs.Screen name="driver-detail" options={{ href: null }} />
    </Tabs>
  );
}

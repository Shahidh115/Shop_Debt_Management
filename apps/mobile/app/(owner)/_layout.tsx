import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '@shopledger/shared';

export default function ShopOwnerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.deepForestOlive,
        tabBarInactiveTintColor: COLORS.mutedText,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.borderNeutral,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="complaints" options={{ title: 'Complaints' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}


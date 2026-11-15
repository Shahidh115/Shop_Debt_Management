import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MobileStoreProvider } from '@/store/useShopLedgerStore';

export default function RootLayout() {
  return (
    <MobileStoreProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </MobileStoreProvider>
  );
}


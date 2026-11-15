import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton } from '@/components/MobileUI';

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { state, currentUserId, activeShopId, signOut } = useMobileStore();

  const owner = state.profiles.find((p) => p.id === currentUserId);
  const shop = state.shops.find((s) => s.id === activeShopId) ?? state.shops[0]!;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames O21, O32, O35, O47–O49, O53"
          title="Shop & Owner Profile"
          badge={shop.shop_code}
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shop Information (O21 / O53)</Text>
          <Text style={styles.line}>Shop Name: {shop.shop_name}</Text>
          <Text style={styles.line}>Category: {shop.category}</Text>
          <Text style={styles.line}>Address: {shop.address}</Text>
          <Text style={styles.line}>Phone: {shop.phone}</Text>
          <Text style={styles.line}>Email: {shop.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Owner Account</Text>
          <Text style={styles.line}>Full Name: {owner?.full_name ?? 'Kamal Silva'}</Text>
          <Text style={styles.line}>Email: {owner?.email ?? 'kamal.silva@example.lk'}</Text>
          <Text style={styles.line}>Role: shop_owner</Text>
        </View>

        <PrimaryButton
          label="Sign Out"
          variant="danger"
          onPress={() => {
            signOut();
            router.replace('/(auth)/login');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.warmIvory,
  },
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoalText,
    marginBottom: 4,
  },
  line: {
    fontSize: 13,
    color: COLORS.charcoalText,
  },
});


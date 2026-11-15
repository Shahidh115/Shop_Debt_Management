import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, formatLKR, addMoney } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton } from '@/components/MobileUI';

export default function OwnerHomeScreen() {
  const router = useRouter();
  const { engine, state, currentUserId, activeShopId } = useMobileStore();

  const shop = state.shops.find((s) => s.id === activeShopId) ?? state.shops[0]!;
  const links = state.shopCustomers.filter((sc) => sc.shop_id === shop.id);
  const shopTotalSummary = links.reduce(
    (acc, link) => {
      const bal = engine.getCustomerBalance(currentUserId, shop.id, link.customer_id);
      return {
        outstanding_balance: addMoney(acc.outstanding_balance, bal.outstanding_balance),
        total_debits: addMoney(acc.total_debits, bal.total_debits),
        total_credits: addMoney(acc.total_credits, bal.total_credits),
      };
    },
    { outstanding_balance: '0.00', total_debits: '0.00', total_credits: '0.00' }
  );
  const openComplaints = state.complaints.filter(
    (c) => c.shop_id === shop.id && (c.status === 'pending' || c.status === 'under_review')
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle={`${shop.shop_code} · Shop Owner Dashboard (Frames O02, O22, O52)`}
          title={shop.shop_name}
          badge={shop.status.toUpperCase()}
        />

        {/* Hero Receivable Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL SHOP CREDIT RECEIVABLE (ALL CUSTOMERS)</Text>
          <Text style={styles.heroValue}>{formatLKR(shopTotalSummary.outstanding_balance)}</Text>
          <Text style={styles.heroSub}>
            Across all {links.length} linked shop customers
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricCaption}>Total Debits</Text>
              <Text style={[styles.metricAmount, { color: COLORS.debitPurchase }]}>
                +{formatLKR(shopTotalSummary.total_debits)}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricCaption}>Total Credits</Text>
              <Text style={[styles.metricAmount, { color: COLORS.creditPayment }]}>
                -{formatLKR(shopTotalSummary.total_credits)}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricCaption}>Open Disputes</Text>
              <Text style={styles.metricAmount}>{openComplaints.length}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <PrimaryButton
            label="+ Add Credit Purchase (O07 / O08)"
            onPress={() => router.push('/(owner)/transactions')}
          />
          <PrimaryButton
            label="Record Customer Payment (O11–O13)"
            variant="success"
            onPress={() => router.push('/(owner)/transactions')}
          />
          <PrimaryButton
            label="Manage & Invite Customers (O03–O05)"
            variant="outline"
            onPress={() => router.push('/(owner)/customers')}
          />
        </View>
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.charcoalText,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderNeutral,
  },
  metricCol: {
    flex: 1,
  },
  metricCaption: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  metricAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.charcoalText,
    marginTop: 2,
  },
  actionsGrid: {
    gap: 10,
  },
});


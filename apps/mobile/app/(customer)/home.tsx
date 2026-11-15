import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, SEED_IDS, formatLKR } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader } from '@/components/MobileUI';

export default function CustomerHomeScreen() {
  const { engine, state, currentUserId, activeShopId, setActiveShopId } = useMobileStore();

  const resolvedCustomerId = currentUserId || SEED_IDS.CUSTOMER_AHMED;
  const customerLinks = state.shopCustomers.filter(
    (sc) => sc.customer_id === resolvedCustomerId
  );
  const balance = engine.getCustomerBalance(
    resolvedCustomerId,
    activeShopId,
    resolvedCustomerId
  );
  const activeShop = state.shops.find((s) => s.id === activeShopId) ?? state.shops[0]!;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames C02, C03, C04, C14, C15, C39 · Multi-Shop Switcher"
          title={activeShop.shop_name}
          badge={activeShop.shop_code}
        />

        {/* Multi-Shop Selector Pills (Frame C03) */}
        <View style={styles.shopSelector}>
          {customerLinks.map((link) => {
            const shop = state.shops.find((s) => s.id === link.shop_id);
            const isSelected = link.shop_id === activeShopId;
            return (
              <TouchableOpacity
                key={link.id}
                onPress={() => setActiveShopId(link.shop_id)}
                style={[styles.shopChip, isSelected && styles.shopChipActive]}
              >
                <Text style={[styles.shopChipText, isSelected && { color: '#FFFFFF' }]}>
                  {shop?.shop_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Shop-Scoped Balance Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            {Number(balance.outstanding_balance) === 0
              ? 'FRAME C15 · ALL SETTLED'
              : 'OUTSTANDING CREDIT AT THIS SHOP'}
          </Text>
          <Text style={styles.heroValue}>{formatLKR(balance.outstanding_balance)}</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.col}>
              <Text style={styles.caption}>Opening</Text>
              <Text style={styles.amount}>{formatLKR(balance.opening_balance)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.caption}>Purchases</Text>
              <Text style={[styles.amount, { color: COLORS.debitPurchase }]}>
                +{formatLKR(balance.total_purchases)}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.caption}>Payments</Text>
              <Text style={[styles.amount, { color: COLORS.creditPayment }]}>
                -{formatLKR(balance.total_payments)}
              </Text>
            </View>
          </View>
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
  shopSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shopChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    alignItems: 'center',
  },
  shopChipActive: {
    backgroundColor: COLORS.deepForestOlive,
    borderColor: COLORS.deepForestOlive,
  },
  shopChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.charcoalText,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
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
  breakdownRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderNeutral,
  },
  col: {
    flex: 1,
  },
  caption: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    color: COLORS.charcoalText,
  },
});


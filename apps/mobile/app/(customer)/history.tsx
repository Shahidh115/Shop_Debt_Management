import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, SEED_IDS, formatLKR } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader } from '@/components/MobileUI';

export default function CustomerHistoryScreen() {
  const { engine, currentUserId, activeShopId } = useMobileStore();
  const resolvedCustomerId = currentUserId || SEED_IDS.CUSTOMER_AHMED;

  const statement = engine.getCustomerStatement(
    resolvedCustomerId,
    activeShopId,
    resolvedCustomerId
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames C05, C06, C07, C12, C25, C30, C35, C36"
          title="Purchases, Payments & Statement"
          badge={formatLKR(statement.closing_balance)}
        />

        <View style={styles.card}>
          {statement.entries
            .slice()
            .reverse()
            .map((entry) => {
              const isDebit = Number(entry.debit_amount) > 0;
              return (
                <View key={entry.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.desc}>{entry.description}</Text>
                    <Text style={styles.meta}>
                      {entry.reference_code} · {entry.transaction_type}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontWeight: '700',
                        color: isDebit ? COLORS.debitPurchase : COLORS.creditPayment,
                      }}
                    >
                      {isDebit
                        ? `+${formatLKR(entry.debit_amount)}`
                        : `-${formatLKR(entry.credit_amount)}`}
                    </Text>
                    <Text style={styles.meta}>Bal: {formatLKR(entry.running_balance)}</Text>
                  </View>
                </View>
              );
            })}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderNeutral,
  },
  desc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.charcoalText,
  },
  meta: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
});


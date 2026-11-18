import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, SEED_IDS, formatLKR } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton, StatusPill } from '@/components/MobileUI';

export default function CustomerComplaintsScreen() {
  const { state, currentUserId, activeShopId, submitComplaint } = useMobileStore();
  const resolvedCustomerId = currentUserId || SEED_IDS.CUSTOMER_AHMED;

  const disputableTransactions = [
    ...state.purchases
      .filter((p) => p.shop_id === activeShopId && p.customer_id === resolvedCustomerId)
      .map((p) => ({
        id: p.id,
        transaction_type: 'purchase' as const,
        code: p.reference_code ?? p.transaction_code,
        description: p.description ?? 'Credit Purchase',
        amount: p.total_amount,
      })),
    ...state.payments
      .filter((p) => p.shop_id === activeShopId && p.customer_id === resolvedCustomerId)
      .map((p) => ({
        id: p.id,
        transaction_type: 'payment' as const,
        code: p.reference_code ?? p.transaction_code,
        description: p.notes ?? `Payment (${p.payment_method})`,
        amount: p.amount,
      })),
  ];

  const [selectedTxId, setSelectedTxId] = useState<string>(
    disputableTransactions[0]?.id ?? SEED_IDS.PURCHASE_1050
  );
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const selectedTx =
    disputableTransactions.find((tx) => tx.id === selectedTxId) ?? disputableTransactions[0];

  const complaints = state.complaints.filter(
    (c) => c.shop_id === activeShopId && c.customer_id === resolvedCustomerId
  );

  const handleSubmit = () => {
    if (!selectedTx) return;

    submitComplaint({
      shop_id: activeShopId,
      transaction_type: selectedTx.transaction_type,
      transaction_id: selectedTx.id,
      complaint_type: 'incorrect_amount',
      description: description.trim() || `Issue reported on ${selectedTx.code}`,
      evidence_url: 'receipt-photo.jpg',
    });

    setDescription('');
    setNotice(
      `Complaint submitted for ${selectedTx.code} (Frame C09). Note: Raising a complaint does not automatically alter your balance until reviewed and adjusted.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames C08–C11, C16–C19, C24, C33, C34, C37"
          title="Transaction Complaints"
          badge={`${complaints.length} Filed`}
        />

        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Select Transaction to Dispute (C08 / C33)</Text>
          {disputableTransactions.map((tx) => {
            const isSel = selectedTx?.id === tx.id;
            return (
              <TouchableOpacity
                key={tx.id}
                onPress={() => setSelectedTxId(tx.id)}
                style={[styles.txSelectRow, isSel && styles.txSelectRowActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txTitle, isSel && { color: COLORS.deepForestOlive }]}>
                    {tx.description}
                  </Text>
                  <Text style={styles.txMeta}>
                    {tx.code} · {tx.transaction_type}
                  </Text>
                </View>
                <Text style={[styles.txAmount, isSel && { color: COLORS.primaryOlive }]}>
                  {formatLKR(tx.amount)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.cardTitle, { marginTop: 6 }]}>2. Describe the Issue *</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Explain what is wrong with this transaction..."
            multiline
            style={styles.input}
          />
          <PrimaryButton
            label={
              selectedTx ? `Submit Complaint for ${selectedTx.code}` : 'Select a Transaction'
            }
            onPress={handleSubmit}
          />
        </View>

        {complaints.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.code}>
                {c.complaint_code} · Ref {c.transaction_ref_code}
              </Text>
              <StatusPill
                label={c.status}
                tone={c.status === 'resolved' ? 'success' : 'warning'}
              />
            </View>
            <Text style={styles.desc}>{c.description}</Text>
            {c.owner_response ? (
              <Text style={styles.ownerReply}>Shop Response: {c.owner_response}</Text>
            ) : null}
          </View>
        ))}
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
  notice: {
    backgroundColor: COLORS.successBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  noticeText: {
    color: COLORS.deepForestOlive,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  input: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    backgroundColor: COLORS.warmIvory,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.deepForestOlive,
  },
  desc: {
    fontSize: 13,
    color: COLORS.charcoalText,
  },
  ownerReply: {
    fontSize: 12,
    color: COLORS.primaryOlive,
    fontWeight: '600',
  },
  txSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    backgroundColor: COLORS.warmIvory,
  },
  txSelectRowActive: {
    borderColor: COLORS.primaryOlive,
    backgroundColor: COLORS.softSage,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  txMeta: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
});


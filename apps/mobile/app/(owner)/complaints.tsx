import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, formatLKR } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton, StatusPill } from '@/components/MobileUI';

export default function OwnerComplaintsScreen() {
  const { state, activeShopId, createCorrection, reviewComplaint } = useMobileStore();

  const [adjustmentAmount, setAdjustmentAmount] = useState('500.00');
  const [responseNote, setResponseNote] = useState(
    'Verified receipt and issued credit adjustment entry.'
  );
  const [banner, setBanner] = useState<string | null>(null);

  const complaints = state.complaints.filter((c) => c.shop_id === activeShopId);

  const handleIssueCorrectionAndResolve = (complaintId: string) => {
    const comp = complaints.find((c) => c.id === complaintId);
    if (!comp) return;
    const origLedger =
      state.ledgerEntries.find((le) => le.reference_id === comp.transaction_id) ??
      state.ledgerEntries.find((le) => le.shop_id === activeShopId)!;

    createCorrection({
      shop_id: activeShopId,
      customer_id: comp.customer_id,
      original_ledger_entry_id: origLedger.id,
      correction_type: 'adjustment',
      direction: 'credit',
      amount: adjustmentAmount,
      reason: responseNote,
      complaint_id: comp.id,
    });

    reviewComplaint({
      complaint_id: comp.id,
      status: 'resolved',
      owner_response: responseNote,
    });

    setBanner(
      `Issued separate immutable adjustment (-Rs. ${adjustmentAmount}) and resolved ${comp.complaint_code} (Frames O18–O20).`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames O16–O20, O24, O25, O29"
          title="Complaint Management"
          badge={`${complaints.length} Total`}
        />

        {banner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        {complaints.map((comp) => (
          <View key={comp.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.code}>
                {comp.complaint_code} · Ref {comp.transaction_ref_code}
              </Text>
              <StatusPill
                label={comp.status}
                tone={comp.status === 'resolved' ? 'success' : 'warning'}
              />
            </View>
            <Text style={styles.desc}>{comp.description}</Text>
            <Text style={styles.meta}>
              Disputed Amount: {formatLKR(comp.disputed_amount ?? '0.00')} · Type:{' '}
              {comp.complaint_type}
            </Text>

            {comp.status !== 'resolved' ? (
              <View style={styles.actionPanel}>
                <Text style={styles.subLabel}>
                  Create Separate Adjustment Entry (O18 / O19 — Original Entry Remains Intact)
                </Text>
                <TextInput
                  value={adjustmentAmount}
                  onChangeText={setAdjustmentAmount}
                  placeholder="Credit Adjustment Amount (Rs.)"
                  style={styles.input}
                />
                <TextInput
                  value={responseNote}
                  onChangeText={setResponseNote}
                  placeholder="Resolution note for customer"
                  style={styles.input}
                />
                <PrimaryButton
                  label="Create Adjustment & Resolve Complaint (O20)"
                  onPress={() => handleIssueCorrectionAndResolve(comp.id)}
                />
              </View>
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
  banner: {
    backgroundColor: COLORS.successBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  bannerText: {
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
  meta: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  actionPanel: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderNeutral,
    gap: 8,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.deepForestOlive,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: COLORS.warmIvory,
  },
});


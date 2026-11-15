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
import {
  COLORS,
  formatLKR,
  calculateItemLineTotal,
  calculatePurchaseItemsTotal,
} from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton } from '@/components/MobileUI';

type Mode = 'ledger' | 'quick_purchase' | 'itemized_purchase' | 'record_payment' | 'statement';

export default function OwnerTransactionsScreen() {
  const {
    engine,
    state,
    currentUserId,
    activeShopId,
    selectedCustomerId,
    setSelectedCustomerId,
    recordPurchase,
    recordPayment,
  } = useMobileStore();

  const [mode, setMode] = useState<Mode>('quick_purchase');
  const [customerSearch, setCustomerSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [items] = useState([
    { item_name: 'Samba Rice 5kg', quantity: '1', unit_price: '1450.00' },
    { item_name: 'Red Dhal 1kg', quantity: '2', unit_price: '380.00' },
    { item_name: 'White Sugar 1kg', quantity: '1', unit_price: '290.00' },
  ]);
  const [notice, setNotice] = useState<string | null>(null);

  const shopCustomers = state.shopCustomers.filter((sc) => sc.shop_id === activeShopId);
  const filteredCustomers = shopCustomers.filter((sc) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    const p = state.profiles.find((prof) => prof.id === sc.customer_id);
    if (!p) return false;
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q)
    );
  });

  const statement = engine.getCustomerStatement(currentUserId, activeShopId, selectedCustomerId);
  const balance = engine.getCustomerBalance(currentUserId, activeShopId, selectedCustomerId);

  const handleQuickPurchase = () => {
    recordPurchase({
      shop_id: activeShopId,
      customer_id: selectedCustomerId,
      mode: 'quick',
      total_amount: amount,
      description,
    });
    setNotice(
      `Quick credit purchase of Rs. ${amount} added to ${balance.customer_name} (Frames O07, O09, O10).`
    );
    setAmount('');
    setDescription('');
    setMode('ledger');
  };

  const handleItemizedPurchase = () => {
    const computedTotal = calculatePurchaseItemsTotal(items).totalAmount;
    recordPurchase({
      shop_id: activeShopId,
      customer_id: selectedCustomerId,
      mode: 'itemized',
      description: `Itemized purchase (${items.length} items)`,
      items,
    });
    setNotice(`Itemized purchase of ${formatLKR(computedTotal)} recorded (Frame O08).`);
    setMode('ledger');
  };

  const handlePayment = () => {
    recordPayment({
      shop_id: activeShopId,
      customer_id: selectedCustomerId,
      amount,
      payment_method: paymentMethod,
      reference_number: paymentMethod === 'cash' ? null : referenceNumber,
      notes: description,
    });
    setNotice(`Payment of Rs. ${amount} (${paymentMethod}) recorded (Frames O11–O13, O37–O43).`);
    setAmount('');
    setDescription('');
    setReferenceNumber('');
    setMode('ledger');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle={`Frames O07–O15, O28, O37–O44, O46, O51 · ${balance.customer_name}`}
          title="Transactions & Statements"
          badge={formatLKR(balance.outstanding_balance)}
        />

        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {/* Search & Select Customer Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Search & Select Customer</Text>
          <TextInput
            value={customerSearch}
            onChangeText={setCustomerSearch}
            placeholder="Search customer by name, email, or phone..."
            style={styles.input}
          />
          {filteredCustomers.map((sc) => {
            const p = state.profiles.find((prof) => prof.id === sc.customer_id);
            const cBal = engine.getCustomerBalance(currentUserId, activeShopId, sc.customer_id);
            const isSelected = sc.customer_id === selectedCustomerId;
            return (
              <TouchableOpacity
                key={sc.id}
                onPress={() => setSelectedCustomerId(sc.customer_id)}
                style={[
                  styles.customerSelectRow,
                  isSelected && styles.customerSelectRowActive,
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.customerSelectName,
                      isSelected && { color: COLORS.deepForestOlive },
                    ]}
                  >
                    {p?.full_name}
                  </Text>
                  <Text style={styles.ledgerMeta}>{p?.email}</Text>
                </View>
                <Text
                  style={[
                    styles.customerSelectBal,
                    isSelected && { color: COLORS.primaryOlive },
                  ]}
                >
                  {formatLKR(cBal.outstanding_balance)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mode Switcher */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            onPress={() => setMode('quick_purchase')}
            style={styles.toolBtn}
          >
            <Text style={styles.toolBtnText}>+ Quick Purchase (O07)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('itemized_purchase')}
            style={styles.toolBtn}
          >
            <Text style={styles.toolBtnText}>+ Itemized (O08)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('record_payment')}
            style={styles.toolBtn}
          >
            <Text style={styles.toolBtnText}>+ Payment (O11)</Text>
          </TouchableOpacity>
        </View>

        {mode === 'quick_purchase' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              2. Quick Credit Purchase for {balance.customer_name} (O07, O09, O10)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount (Rs.) *"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              style={styles.input}
            />
            <PrimaryButton
              label={
                amount.trim()
                  ? `Add +Rs. ${amount} to ${balance.customer_name}`
                  : `Add Purchase to ${balance.customer_name}`
              }
              onPress={handleQuickPurchase}
            />
          </View>
        )}

        {mode === 'itemized_purchase' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detailed Itemized Purchase (Frame O08)</Text>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemMath}>
                  {item.quantity} × {formatLKR(item.unit_price)} ={' '}
                  {formatLKR(calculateItemLineTotal(item.quantity, item.unit_price))}
                </Text>
              </View>
            ))}
            <Text style={styles.totalLine}>
              Total: {formatLKR(calculatePurchaseItemsTotal(items).totalAmount)}
            </Text>
            <PrimaryButton label="Record Itemized Bill" onPress={handleItemizedPurchase} />
          </View>
        )}

        {mode === 'record_payment' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Record Customer Payment (Frames O11–O13, O37–O43)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Payment Amount (Rs.) *"
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.methodRow}>
              {(['cash', 'bank_transfer', 'other'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={[
                    styles.methodBtn,
                    paymentMethod === m && styles.methodBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === m && { color: '#FFFFFF' },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {paymentMethod !== 'cash' ? (
              <TextInput
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="Bank / Reference Number"
                style={styles.input}
              />
            ) : null}
            <PrimaryButton
              label="Confirm & Record Payment"
              variant="success"
              onPress={handlePayment}
            />
          </View>
        )}

        {/* Ledger & Statement Table (Frames O14, O15, O46) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Account Statement & Running Balance (O14 / O15 / O46)
          </Text>
          {statement.entries
            .slice()
            .reverse()
            .map((entry) => {
              const isDebit = Number(entry.debit_amount) > 0;
              return (
                <View key={entry.id} style={styles.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerDesc}>{entry.description}</Text>
                    <Text style={styles.ledgerMeta}>
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
                    <Text style={styles.ledgerMeta}>
                      Bal: {formatLKR(entry.running_balance)}
                    </Text>
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
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: COLORS.deepForestOlive,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toolBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: COLORS.warmIvory,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderNeutral,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemMath: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  totalLine: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.deepForestOlive,
    textAlign: 'right',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: COLORS.deepForestOlive,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.charcoalText,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderNeutral,
  },
  ledgerDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.charcoalText,
  },
  ledgerMeta: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  customerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    backgroundColor: COLORS.warmIvory,
  },
  customerSelectRowActive: {
    borderColor: COLORS.primaryOlive,
    backgroundColor: COLORS.softSage,
  },
  customerSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  customerSelectBal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
});


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
import { useRouter } from 'expo-router';
import { COLORS, formatLKR } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton, StatusPill } from '@/components/MobileUI';

export default function OwnerCustomersScreen() {
  const router = useRouter();
  const {
    engine,
    state,
    currentUserId,
    activeShopId,
    selectedCustomerId,
    setSelectedCustomerId,
    inviteCustomer,
  } = useMobileStore();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+94 77 ');
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [banner, setBanner] = useState<string | null>(null);

  const links = state.shopCustomers.filter((sc) => sc.shop_id === activeShopId);

  const handleInvite = () => {
    try {
      inviteCustomer({
        shop_id: activeShopId,
        full_name: fullName,
        email,
        phone,
        opening_balance: openingBalance,
      });
      setBanner(`Invitation / shop link processed for ${email} (Frames O04, O05, O23).`);
      setFullName('');
      setEmail('');
      setShowInviteForm(false);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Failed to invite customer');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames O03–O06, O23, O26, O27, O31, O36, O45"
          title="Shop Customers"
          badge={`${links.length} Linked`}
        />

        {banner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        <View style={{ marginBottom: 14 }}>
          <PrimaryButton
            label={showInviteForm ? 'Close Invite Form' : '+ Invite or Link Customer by Email'}
            onPress={() => setShowInviteForm((prev) => !prev)}
          />
        </View>

        {showInviteForm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invite / Link Customer (O04 & O05)</Text>
            <Text style={styles.helper}>
              If the customer already uses ShopLedger at another shop, their existing login account
              will be linked to your shop automatically.
            </Text>
            <TextInput
              placeholder="Customer full name"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />
            <TextInput
              placeholder="Customer email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
            />
            <TextInput
              placeholder="Opening balance (Rs.)"
              value={openingBalance}
              onChangeText={setOpeningBalance}
              keyboardType="numeric"
              style={styles.input}
            />
            <PrimaryButton label="Send Invitation / Link Customer" onPress={handleInvite} />
          </View>
        ) : null}

        <TextInput
          placeholder="Search customer name or email (O27 / O45)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.input, { backgroundColor: '#FFFFFF', marginBottom: 12 }]}
        />

        {links.map((link) => {
          const profile = state.profiles.find((p) => p.id === link.customer_id);
          if (
            searchQuery.trim() &&
            !profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !profile?.email.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return null;
          }
          const bal = engine.getCustomerBalance(currentUserId, activeShopId, link.customer_id);
          const isSelected = link.customer_id === selectedCustomerId;
          return (
            <TouchableOpacity
              key={link.id}
              onPress={() => {
                setSelectedCustomerId(link.customer_id);
                router.push('/(owner)/transactions');
              }}
              style={[styles.customerCard, isSelected && styles.customerCardSelected]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{profile?.full_name}</Text>
                <Text style={styles.customerEmail}>{profile?.email}</Text>
                <Text style={styles.viewTxHint}>Tap customer to view all transactions →</Text>
                <View style={{ marginTop: 6 }}>
                  <StatusPill
                    label={link.status === 'active' ? 'Active' : 'Pending Invite'}
                    tone={link.status === 'active' ? 'success' : 'warning'}
                  />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.balanceLabel}>Outstanding</Text>
                <Text style={styles.balanceValue}>{formatLKR(bal.outstanding_balance)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCustomerId(link.customer_id);
                    router.push('/(owner)/transactions');
                  }}
                  style={styles.addPurchaseBtn}
                >
                  <Text style={styles.addPurchaseBtnText}>+ Add Purchase</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addPurchaseBtn: {
    backgroundColor: COLORS.primaryOlive,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPurchaseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
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
    marginBottom: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  helper: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: COLORS.warmIvory,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerCardSelected: {
    borderColor: COLORS.primaryOlive,
    borderWidth: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  customerEmail: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  viewTxHint: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryOlive,
    marginTop: 3,
  },
  balanceLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepForestOlive,
    marginTop: 2,
  },
});


/**
 * ShopLedger — Shared Zod Validation Schemas
 * Enforces strict input validation across Admin Web, Shop Owner Mobile, Customer Mobile, and Edge Functions.
 */

import { z } from 'zod';

/**
 * Validates positive monetary strings with up to 2 decimal places (e.g., "2500", "2500.00", "400.50").
 * Rejects zero, negative values, NaN, or >2 decimal places.
 */
export const positiveMoneyStringSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/,/g, ''))
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
    message: 'Enter a valid amount in LKR (up to 2 decimal places).',
  })
  .refine(
    (val) => {
      const parts = val.split('.');
      const whole = BigInt(parts[0] || '0');
      const frac = BigInt((parts[1] || '0').padEnd(2, '0'));
      return whole * 100n + frac > 0n;
    },
    {
      message: 'Amount must be greater than Rs. 0.00.',
    },
  );

export const nonNegativeMoneyStringSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/,/g, ''))
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
    message: 'Enter a valid non-negative amount in LKR.',
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address.');

export const phoneSchema = z
  .string()
  .trim()
  .min(9, 'Enter a valid phone number (e.g., +94 77 123 4567).')
  .max(20, 'Phone number is too long.');

// 1. Admin — Create / Edit Shop Schema (A04 & A05 Edit)
export const createShopSchema = z.object({
  shop_name: z.string().trim().min(2, 'Shop name is required.').max(120),
  category: z.string().trim().optional().default('Grocery & provisions'),
  owner_full_name: z.string().trim().min(2, 'Owner full name is required.').max(120),
  owner_email: emailSchema,
  owner_phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: phoneSchema,
  city: z.string().trim().optional().default('Colombo'),
  status: z.enum(['active', 'suspended']).default('active'),
  address: z.string().trim().min(5, 'Shop address is required.').max(250),
  logo_url: z.string().url().optional().nullable(),
  send_invitation_email: z.boolean().optional().default(true),
});
export const CreateShopSchema = createShopSchema;

export const updateShopSchema = z.object({
  shop_id: z.string().uuid(),
  shop_name: z.string().trim().min(2, 'Shop name is required.').max(120),
  phone: phoneSchema,
  address: z.string().trim().min(5, 'Shop address is required.').max(250),
  logo_url: z.string().url().optional().nullable(),
});

export const shopStatusActionSchema = z.object({
  shop_id: z.string().uuid(),
  action: z.enum(['suspend', 'reactivate']),
  reason: z
    .string()
    .trim()
    .min(3, 'Audit reason is required before changing shop status.')
    .max(300),
});

// 2. Shop Owner — Add / Invite Customer Schema (O04 / O36)
export const inviteCustomerSchema = z.object({
  shop_id: z.string().uuid(),
  full_name: z.string().trim().min(2, 'Customer full name is required.').max(120),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().trim().max(250).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  opening_balance: nonNegativeMoneyStringSchema.optional().default('0.00'),
});

// 3. Shop Owner — Add Purchase Schema (O07 Quick & O08 Detailed)
export const purchaseItemSchema = z.object({
  item_name: z.string().trim().min(1, 'Item name is required.').max(120),
  quantity: z
    .string()
    .trim()
    .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && Number(v) > 0, {
      message: 'Quantity must be greater than 0.',
    }),
  unit_price: positiveMoneyStringSchema,
});

export const createPurchaseSchema = z.object({
  shop_id: z.string().uuid(),
  customer_id: z.string().uuid('Please select a customer.'),
  purchase_date: z.string().min(1, 'Purchase date is required.'),
  mode: z.enum(['quick', 'detailed']),
  total_amount: positiveMoneyStringSchema,
  description: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(purchaseItemSchema).optional().default([]),
  idempotency_key: z.string().min(8, 'Idempotency key is required.'),
});

// 4. Shop Owner — Record Payment Schema (O11 / O38 / O39)
export const recordPaymentSchema = z.object({
  shop_id: z.string().uuid(),
  customer_id: z.string().uuid('Please select a customer.'),
  amount: positiveMoneyStringSchema,
  payment_date: z.string().min(1, 'Payment date is required.'),
  payment_method: z.enum(['cash', 'bank_transfer', 'other']),
  reference_number: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  idempotency_key: z.string().min(8, 'Idempotency key is required.'),
});

// 5. Shop Owner — Transaction Correction / Reversal Schema (O18 / O19)
export const createCorrectionSchema = z.object({
  shop_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  original_ledger_entry_id: z.string().uuid(),
  complaint_id: z.string().uuid().optional().nullable(),
  adjustment_type: z.enum(['partial_correction', 'full_reversal', 'debit_adjustment']),
  amount: positiveMoneyStringSchema,
  explanation: z
    .string()
    .trim()
    .min(5, 'An audit explanation is required for every correction.')
    .max(500),
  idempotency_key: z.string().min(8, 'Idempotency key is required.'),
});

// 6. Customer — Raise Complaint Schema (C08)
export const createComplaintSchema = z.object({
  shop_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  transaction_type: z.enum(['purchase', 'payment']),
  transaction_id: z.string().uuid(),
  complaint_type: z.enum([
    'incorrect_amount',
    'purchase_not_made',
    'payment_not_updated',
    'duplicate_transaction',
    'incorrect_description',
    'other',
  ]),
  description: z
    .string()
    .trim()
    .min(5, 'Please provide a clear explanation of the problem.')
    .max(1000),
  evidence_url: z.string().optional().nullable(),
});

// 7. Shop Owner — Review Complaint Schema (O17 / O24 / O25)
export const reviewComplaintSchema = z.object({
  complaint_id: z.string().uuid(),
  shop_id: z.string().uuid(),
  decision: z.enum(['under_review', 'accepted', 'rejected']),
  owner_response: z
    .string()
    .trim()
    .min(3, 'Please provide a response or explanation for the customer.')
    .max(500),
});

export type CreateShopInput = z.input<typeof createShopSchema>;
export interface UpdateShopInput {
  shop_id: string;
  shop_name?: string;
  category?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  logo_url?: string | null;
}
export type ShopStatusActionInput = z.infer<typeof shopStatusActionSchema>;
export interface InviteCustomerInput {
  shop_id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string | null;
  avatar_url?: string | null;
  opening_balance?: string;
  notes?: string;
}
export interface CreatePurchaseInput {
  shop_id: string;
  customer_id: string;
  purchase_date?: string;
  mode?: 'quick' | 'itemized' | 'detailed';
  total_amount?: string;
  description?: string | null;
  notes?: string | null;
  items?: Array<{ item_name: string; quantity: string; unit_price: string }>;
  idempotency_key?: string;
}
export interface RecordPaymentInput {
  shop_id: string;
  customer_id: string;
  amount: string;
  payment_date?: string;
  payment_method: 'cash' | 'bank_transfer' | 'other';
  reference_number?: string | null;
  notes?: string | null;
  idempotency_key?: string;
}
export interface CreateCorrectionInput {
  shop_id: string;
  customer_id: string;
  original_ledger_entry_id: string;
  complaint_id?: string | null;
  correction_type: 'adjustment' | 'reversal';
  direction?: 'credit' | 'debit';
  amount?: string;
  reason: string;
  idempotency_key?: string;
}
export interface CreateComplaintInput {
  shop_id: string;
  customer_id?: string;
  transaction_type: 'purchase' | 'payment';
  transaction_id: string;
  complaint_type:
    | 'incorrect_amount'
    | 'purchase_not_made'
    | 'payment_not_updated'
    | 'duplicate_transaction'
    | 'incorrect_description'
    | 'other';
  description: string;
  evidence_url?: string | null;
}
export interface ReviewComplaintInput {
  complaint_id: string;
  shop_id?: string;
  status?: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'resolved';
  decision?: 'under_review' | 'accepted' | 'rejected';
  owner_response: string;
}


/**
 * ShopLedger — Authoritative Exact Decimal Financial Accounting Engine
 *
 * CRITICAL INVARIANTS (Phase 4 & Phase 16):
 * 1. NEVER use IEEE-754 floating-point arithmetic (`number` + / - / *) for money.
 * 2. All monetary amounts are converted to integer cents (`BigInt`, 1 LKR = 100 cents)
 *    for exact arithmetic, and serialized as canonical `"XXXX.XX"` decimal strings
 *    matching PostgreSQL `NUMERIC(14,2)`.
 * 3. Accounting convention:
 *    - Debit increases customer debt (`opening_balance`, `purchase`, debit `adjustment`).
 *    - Credit decreases customer debt (`payment`, credit `adjustment`, credit `reversal`).
 *    - Outstanding Balance = Total Debits - Total Credits.
 * 4. Historical transactions are NEVER overwritten or deleted. Corrections add a new
 *    linked `adjustment` or `reversal` ledger entry referencing `reversal_of`.
 */

import type {
  CustomerBalanceSummary,
  LedgerEntry,
  StatementLineItem,
} from '../types';

/**
 * Parses a decimal string (e.g., `"2500"`, `"2,500.00"`, `"-500.25"`) into exact integer cents (`BigInt`).
 * Throws an error if the input is malformed or has more than 2 decimal places.
 */
export function parseMoneyToCents(amountStr: string): bigint {
  if (typeof amountStr !== 'string') {
    throw new Error('Monetary amount must be provided as a string, never a float.');
  }
  const cleaned = amountStr.trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`Invalid monetary amount format: "${amountStr}"`);
  }

  const isNegative = cleaned.startsWith('-');
  const unsigned = isNegative ? cleaned.slice(1) : cleaned;
  const [wholePart = '0', fracPart = ''] = unsigned.split('.');
  const paddedFrac = fracPart.padEnd(2, '0');

  const cents = BigInt(wholePart) * 100n + BigInt(paddedFrac);
  return isNegative ? -cents : cents;
}

/**
 * Converts integer cents (`BigInt`) into a canonical PostgreSQL `NUMERIC(14,2)` string (e.g., `"2500.00"`).
 */
export function formatCentsToDecimal(cents: bigint): string {
  const isNegative = cents < 0n;
  const absCents = isNegative ? -cents : cents;
  const whole = absCents / 100n;
  const frac = (absCents % 100n).toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}${whole.toString()}.${frac}`;
}

/**
 * Formats a decimal string or integer cents into Figma's `Rs. X,XXX` or `Rs. X,XXX.XX` display format.
 */
export function formatLKR(
  amount: string | bigint,
  options: { showDecimals?: boolean; signed?: 'debit' | 'credit' | 'none' } = {},
): string {
  const cents = typeof amount === 'bigint' ? amount : parseMoneyToCents(amount);
  const isNegative = cents < 0n;
  const absCents = isNegative ? -cents : cents;
  const whole = absCents / 100n;
  const frac = absCents % 100n;

  const formattedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const showDec = options.showDecimals ?? frac !== 0n;
  const decSuffix = showDec ? `.${frac.toString().padStart(2, '0')}` : '';

  if (options.signed === 'debit') {
    return `+ Rs. ${formattedWhole}${decSuffix}`;
  }
  if (options.signed === 'credit') {
    return `− Rs. ${formattedWhole}${decSuffix}`;
  }
  if (isNegative) {
    return `− Rs. ${formattedWhole}${decSuffix}`;
  }
  return `Rs. ${formattedWhole}${decSuffix}`;
}

/**
 * Adds two decimal money strings using exact integer-cent arithmetic.
 */
export function addMoney(a: string, b: string): string {
  return formatCentsToDecimal(parseMoneyToCents(a) + parseMoneyToCents(b));
}

/**
 * Subtracts decimal money string `b` from `a` (`a - b`) using exact integer-cent arithmetic.
 */
export function subtractMoney(a: string, b: string): string {
  return formatCentsToDecimal(parseMoneyToCents(a) - parseMoneyToCents(b));
}

/**
 * Calculates line total (`quantity * unit_price`) for a detailed purchase item using exact integer math.
 * Quantity supports up to 3 decimal places (e.g. `1.500` kg).
 */
export function calculateItemLineTotal(quantityStr: string, unitPriceStr: string): string {
  const cleanedQty = quantityStr.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,3})?$/.test(cleanedQty)) {
    throw new Error(`Invalid item quantity: "${quantityStr}"`);
  }
  const [qWhole = '0', qFrac = ''] = cleanedQty.split('.');
  const qtyThousandths = BigInt(qWhole) * 1000n + BigInt(qFrac.padEnd(3, '0'));
  if (qtyThousandths <= 0n) {
    throw new Error('Item quantity must be greater than zero.');
  }

  const unitPriceCents = parseMoneyToCents(unitPriceStr);
  if (unitPriceCents <= 0n) {
    throw new Error('Unit price must be greater than zero.');
  }

  // Round half-up from thousandths of a cent to cents
  const rawProduct = qtyThousandths * unitPriceCents;
  const lineTotalCents = (rawProduct + 500n) / 1000n;
  return formatCentsToDecimal(lineTotalCents);
}

/**
 * Calculates the authoritative total of multiple purchase items and verifies it.
 */
export function calculatePurchaseItemsTotal(
  items: Array<{ quantity: string; unit_price: string }>,
): { lineTotals: string[]; totalAmount: string } {
  let sumCents = 0n;
  const lineTotals: string[] = [];

  for (const item of items) {
    const lineTotal = calculateItemLineTotal(item.quantity, item.unit_price);
    lineTotals.push(lineTotal);
    sumCents += parseMoneyToCents(lineTotal);
  }

  return {
    lineTotals,
    totalAmount: formatCentsToDecimal(sumCents),
  };
}

/**
 * Authoritative ledger balance calculator.
 *
 * Formula (Phase 3 & Phase 4):
 *   Outstanding Balance = Opening Balance + Purchases + Debit Adjustments - Payments - Credit Adjustments
 *                       = Total Debits - Total Credits
 */
export function calculateCustomerBalanceFromLedger(
  shopId: string,
  customerId: string,
  entries: ReadonlyArray<
    Pick<
      LedgerEntry,
      'shop_id' | 'customer_id' | 'transaction_type' | 'debit_amount' | 'credit_amount'
    >
  >,
): CustomerBalanceSummary {
  let openingCents = 0n;
  let purchasesCents = 0n;
  let debitAdjCents = 0n;
  let paymentsCents = 0n;
  let creditAdjCents = 0n;

  for (const entry of entries) {
    // Enforce strict multi-tenant and per-customer scoping
    if (entry.shop_id !== shopId || entry.customer_id !== customerId) {
      continue;
    }

    const debit = parseMoneyToCents(entry.debit_amount);
    const credit = parseMoneyToCents(entry.credit_amount);

    if (debit < 0n || credit < 0n) {
      throw new Error('Ledger debit_amount and credit_amount must be non-negative.');
    }

    switch (entry.transaction_type) {
      case 'opening_balance':
        openingCents += debit;
        creditAdjCents += credit;
        break;
      case 'purchase':
        purchasesCents += debit;
        break;
      case 'payment':
        paymentsCents += credit;
        break;
      case 'adjustment':
      case 'reversal':
        debitAdjCents += debit;
        creditAdjCents += credit;
        break;
    }
  }

  const totalDebits = openingCents + purchasesCents + debitAdjCents;
  const totalCredits = paymentsCents + creditAdjCents;
  const outstandingBalance = totalDebits - totalCredits;

  return {
    shop_id: shopId,
    customer_id: customerId,
    opening_balance: formatCentsToDecimal(openingCents),
    total_purchases: formatCentsToDecimal(purchasesCents),
    total_debit_adjustments: formatCentsToDecimal(debitAdjCents),
    total_payments: formatCentsToDecimal(paymentsCents),
    total_credit_adjustments: formatCentsToDecimal(creditAdjCents),
    total_debits: formatCentsToDecimal(totalDebits),
    total_credits: formatCentsToDecimal(totalCredits),
    outstanding_balance: formatCentsToDecimal(outstandingBalance),
  };
}

/**
 * Generates a chronological statement with running balance for a given date window `[periodStart, periodEnd]`.
 * Any ledger entries strictly before `periodStart` are folded into the statement's `opening_balance`.
 */
export function buildStatementLedger(params: {
  shopId: string;
  customerId: string;
  entries: ReadonlyArray<LedgerEntry>;
  periodStart?: string; // ISO date string or YYYY-MM-DD
  periodEnd?: string;
}): {
  opening_balance: string;
  total_purchases: string;
  total_payments: string;
  net_adjustments: string;
  closing_balance: string;
  lines: StatementLineItem[];
} {
  const { shopId, customerId, entries, periodStart, periodEnd } = params;
  const scoped = entries
    .filter((e) => e.shop_id === shopId && e.customer_id === customerId)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const startMs = periodStart ? new Date(periodStart).getTime() : null;
  const endMs = periodEnd ? new Date(periodEnd).getTime() : null;

  let priorOpeningCents = 0n;
  let periodOpeningEntryCents = 0n;
  let purchasesCents = 0n;
  let paymentsCents = 0n;
  let netAdjCents = 0n; // debit adjustments - credit adjustments/reversals

  const inPeriodEntries: LedgerEntry[] = [];

  for (const entry of scoped) {
    const entryMs = new Date(entry.created_at).getTime();
    const debit = parseMoneyToCents(entry.debit_amount);
    const credit = parseMoneyToCents(entry.credit_amount);

    if (startMs !== null && entryMs < startMs) {
      priorOpeningCents += debit - credit;
      continue;
    }
    if (endMs !== null && entryMs > endMs) {
      continue;
    }

    inPeriodEntries.push(entry);
    if (entry.transaction_type === 'opening_balance') {
      periodOpeningEntryCents += debit - credit;
    } else if (entry.transaction_type === 'purchase') {
      purchasesCents += debit;
    } else if (entry.transaction_type === 'payment') {
      paymentsCents += credit;
    } else {
      netAdjCents += debit - credit;
    }
  }

  const effectiveOpeningCents = priorOpeningCents + periodOpeningEntryCents;
  let runningCents = priorOpeningCents;
  const lines: StatementLineItem[] = [];

  if (priorOpeningCents !== 0n && periodOpeningEntryCents === 0n) {
    lines.push({
      id: 'opening-brought-forward',
      entry_code: 'OPENING',
      date: periodStart ?? scoped[0]?.created_at ?? new Date().toISOString(),
      transaction_type: 'opening_balance',
      description: 'Opening balance',
      debit_amount: '0.00',
      credit_amount: '0.00',
      running_balance: formatCentsToDecimal(runningCents),
      reversal_of: null,
    });
  }

  for (const entry of inPeriodEntries) {
    const debit = parseMoneyToCents(entry.debit_amount);
    const credit = parseMoneyToCents(entry.credit_amount);
    runningCents += debit - credit;

    lines.push({
      id: entry.id,
      entry_code: entry.entry_code,
      reference_code: entry.reference_code ?? entry.entry_code,
      date: entry.created_at,
      created_at: entry.created_at,
      transaction_type: entry.transaction_type,
      description: entry.description,
      debit_amount: formatCentsToDecimal(debit),
      credit_amount: formatCentsToDecimal(credit),
      running_balance: formatCentsToDecimal(runningCents),
      reversal_of: entry.reversal_of,
    });
  }

  const closingCents = effectiveOpeningCents + purchasesCents - paymentsCents + netAdjCents;

  return {
    opening_balance: formatCentsToDecimal(effectiveOpeningCents),
    total_purchases: formatCentsToDecimal(purchasesCents),
    total_payments: formatCentsToDecimal(paymentsCents),
    net_adjustments: formatCentsToDecimal(netAdjCents),
    closing_balance: formatCentsToDecimal(closingCents),
    lines,
  };
}


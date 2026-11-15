import { type StatementSummary, formatLKR } from '@shopledger/shared';

/**
 * Generates clean HTML suitable for `expo-print` / PDF export matching Figma O46 & C35.
 */
export function buildStatementPrintHtml(
  shopName: string,
  shopCode: string,
  shopAddress: string,
  statement: StatementSummary
): string {
  const rowsHtml = statement.entries
    .map(
      (entry) => `
      <tr>
        <td>${new Date(entry.created_at ?? entry.date).toLocaleDateString('en-GB')}</td>
        <td style="font-family: monospace;">${entry.reference_code ?? entry.entry_code}</td>
        <td>${entry.description}</td>
        <td style="text-align: right; color: #D97736;">${
          Number(entry.debit_amount) > 0 ? `+${formatLKR(entry.debit_amount)}` : '—'
        }</td>
        <td style="text-align: right; color: #388E5A;">${
          Number(entry.credit_amount) > 0 ? `-${formatLKR(entry.credit_amount)}` : '—'
        }</td>
        <td style="text-align: right; font-weight: 600;">${formatLKR(entry.running_balance)}</td>
      </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Account Statement — ${shopName}</title>
        <style>
          body { font-family: 'Inter', sans-serif; color: #16241D; background: #FFFFFF; padding: 32px; }
          .header { background: #0F4C31; color: #FFFFFF; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
          .summary { display: flex; gap: 16px; margin-bottom: 24px; }
          .card { border: 1px solid #DCE7E1; background: #F4F8F6; padding: 12px 16px; border-radius: 10px; flex: 1; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #DCE7E1; padding: 10px 8px; text-align: left; }
          th { background: #F8FBFA; color: #5C6F65; text-transform: uppercase; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 12px; color: #68B692;">${shopCode} · Official Account Statement</div>
          <h1 style="margin: 4px 0; font-size: 22px;">${shopName}</h1>
          <div style="font-size: 12px; color: #D1ECE0;">${shopAddress}</div>
        </div>
        <div class="summary">
          <div class="card">
            <div style="font-size: 11px; color: #5C6F65;">Opening Balance</div>
            <div style="font-size: 16px; font-weight: 600;">${formatLKR(statement.opening_balance)}</div>
          </div>
          <div class="card">
            <div style="font-size: 11px; color: #5C6F65;">Total Purchases</div>
            <div style="font-size: 16px; font-weight: 600; color: #D97736;">+${formatLKR(statement.total_purchases)}</div>
          </div>
          <div class="card">
            <div style="font-size: 11px; color: #5C6F65;">Total Payments</div>
            <div style="font-size: 16px; font-weight: 600; color: #388E5A;">-${formatLKR(statement.total_payments)}</div>
          </div>
          <div class="card">
            <div style="font-size: 11px; color: #5C6F65;">Closing Balance</div>
            <div style="font-size: 18px; font-weight: 700; color: #0F4C31;">${formatLKR(statement.closing_balance)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref</th>
              <th>Description</th>
              <th style="text-align: right;">Debit</th>
              <th style="text-align: right;">Credit</th>
              <th style="text-align: right;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;
}


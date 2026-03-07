/**
 * Council Budget — operating budget data per council district.
 * Data: seshat.datasd.org operating budget CSV.
 */

import { parse } from 'csv-parse';
import { Readable } from 'stream';

const BUDGET_URL = 'https://seshat.datasd.org/operating_budget/budget_operating_datasd.csv';

interface BudgetLine {
  amount: number;
  fiscalYear: number;
  cycle: string;
  fundType: string;
  deptName: string;
  account: string;
}

let districtBudgets: Map<number, { totalBudget: number; fiscalYear: number; topAccounts: { name: string; amount: number }[] }> = new Map();

export async function initCouncilBudget(): Promise<void> {
  try {
    const resp = await fetch(BUDGET_URL, {
      headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!resp.ok) throw new Error(`Budget download failed: ${resp.status}`);

    const lines: BudgetLine[] = [];
    const csvParser = parse({ columns: true, skip_empty_lines: true });
    const readable = Readable.fromWeb(resp.body as any);
    readable.on('error', (err) => csvParser.destroy(err));
    readable.pipe(csvParser);

    for await (const row of csvParser) {
      if (row.dept_name?.includes('Council District')) {
        lines.push({
          amount: parseFloat(row.amount) || 0,
          fiscalYear: parseInt(row.report_fy) || 0,
          cycle: row.budget_cycle || '',
          fundType: row.fund_type || '',
          deptName: row.dept_name,
          account: row.account || '',
        });
      }
    }

    // Find the latest FY with adopted budget
    const adoptedFYs = [...new Set(lines.filter((l) => l.cycle === 'adopted').map((l) => l.fiscalYear))];
    const latestFY = Math.max(...adoptedFYs);

    // Aggregate per district for latest adopted FY
    for (let d = 1; d <= 9; d++) {
      const districtName = `Council District ${d}`;
      const districtLines = lines.filter(
        (l) => l.deptName === districtName && l.fiscalYear === latestFY && l.cycle === 'adopted'
      );

      const total = districtLines.reduce((sum, l) => sum + l.amount, 0);

      // Top expense accounts
      const accountTotals: Record<string, number> = {};
      for (const line of districtLines) {
        if (line.amount > 0) {
          accountTotals[line.account] = (accountTotals[line.account] || 0) + line.amount;
        }
      }
      const topAccounts = Object.entries(accountTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      districtBudgets.set(d, { totalBudget: total, fiscalYear: latestFY, topAccounts });
    }

    console.log(`[budget] Loaded council budgets for FY${latestFY} (${districtBudgets.size} districts)`);
  } catch (err) {
    console.error('[budget] Failed to load council budgets:', err);
  }
}

export interface DistrictBudget {
  totalBudget: number;
  fiscalYear: number;
  topAccounts: { name: string; amount: number }[];
}

export function getDistrictBudget(district: number): DistrictBudget | null {
  return districtBudgets.get(district) || null;
}

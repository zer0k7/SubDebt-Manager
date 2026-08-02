import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';

export interface ParsedCsvRow {
  date: string;
  title: string;
  amount: number;
  category: string;
  notes?: string;
}

export function parseCsvContent(content: string): ParsedCsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect header line vs data lines
  const rows: ParsedCsvRow[] = [];
  const startIdx = lines[0].toLowerCase().includes('amount') || lines[0].toLowerCase().includes('date') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length < 2) continue;

    // Flexible column matching: Date, Title/Description, Amount, Category
    let dateStr = new Date().toISOString();
    let titleStr = 'Imported Transaction';
    let amountVal = 0;
    let categoryStr = 'General';
    let notesStr = '';

    for (let c = 0; c < cols.length; c++) {
      const val = cols[c];
      if (!val) continue;

      if (!isNaN(Number(val)) && amountVal === 0 && Number(val) > 0) {
        amountVal = Number(val);
      } else if (val.match(/^\d{4}-\d{2}-\d{2}/) || val.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) dateStr = d.toISOString();
      } else if (titleStr === 'Imported Transaction') {
        titleStr = val;
      } else if (categoryStr === 'General') {
        categoryStr = val;
      } else {
        notesStr = val;
      }
    }

    if (amountVal > 0) {
      rows.push({
        date: dateStr,
        title: titleStr,
        amount: amountVal,
        category: categoryStr,
        notes: notesStr || undefined,
      });
    }
  }

  return rows;
}

export async function importCsvToSpending(rows: ParsedCsvRow[], defaultCurrency: string = 'INR'): Promise<number> {
  if (rows.length === 0) return 0;

  let existing: any[] = [];
  try {
    const raw = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
    if (raw) existing = JSON.parse(raw);
  } catch (err) {}

  const newEntries = rows.map((r) => ({
    id: `csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: r.title,
    amount: r.amount,
    currency: defaultCurrency,
    category: r.category,
    spentAt: r.date,
    notes: r.notes,
  }));

  const updated = [...newEntries, ...existing];
  await storage.set(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(updated));
  return newEntries.length;
}

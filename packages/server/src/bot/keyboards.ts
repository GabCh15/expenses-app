import { Markup } from "telegraf";

// Main menu — shown with /start and /menu
export const mainMenuKeyboard = Markup.keyboard([
  ["➕ Add Expense", "📋 Today"],
  ["📊 Lifetime", "⚙️ Settings"],
]).resize().persistent();

// Shown during step-by-step flows — replaces main menu
export const flowCancelKeyboard = Markup.keyboard([
  ["❌ Cancel"],
]).resize();

// Inline back button for non-menu views
export const backToMenuInline = Markup.inlineKeyboard([
  [Markup.button.callback("🔙 Back to Menu", "menu_back")],
]);

// Category selector for add expense flow
export function categoryKeyboard(categories: Array<{ id: string; name: string; icon: string }>) {
  const buttons = categories.map(c => 
    Markup.button.callback(`${c.icon} ${c.name}`, `cat_${c.id}`)
  );
  // Arrange in rows of 3
  const rows: typeof buttons[] = [];
  for (let i = 0; i < buttons.length; i += 3) {
    rows.push(buttons.slice(i, i + 3));
  }
  rows.push([Markup.button.callback("❌ Cancel", "cancel_add")]);
  return Markup.inlineKeyboard(rows);
}

// Currency selector
export const currencyKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback("💵 USD", "cur_USD"),
    Markup.button.callback("💲 COP", "cur_COP"),
    Markup.button.callback("💶 EUR", "cur_EUR"),
  ],
  [Markup.button.callback("❌ Cancel", "cancel_add")],
]);

// Confirm or edit expense
export function confirmKeyboard(expenseId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("✅ Confirm", `confirm_${expenseId}`),
      Markup.button.callback("❌ Cancel", `cancel_expense_${expenseId}`),
    ],
  ]);
}

// Delete confirmation
export function deleteConfirmKeyboard(expenseId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🗑️ Yes, delete", `delete_${expenseId}`),
      Markup.button.callback("❌ No, keep it", `keep_${expenseId}`),
    ],
  ]);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Calendar: 7-column monthly grid inline keyboard
export function buildCalendarKeyboard(
  year: number,
  month: number,
  activeDays: Set<number>,
  todayStr: string
) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];

  // Row 1: Month navigation
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  rows.push([
    Markup.button.callback("◀️", `month_prev_${monthKey}`),
    Markup.button.callback(`📅 ${MONTH_NAMES[month - 1]} ${year}`, "day_noop"),
    Markup.button.callback("▶️", `month_next_${monthKey}`),
  ]);

  // Day rows: 7 columns (Sun-Sat)
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  let currentRow: ReturnType<typeof Markup.button.callback>[] = [];

  // Empty leading slots
  for (let i = 0; i < firstDay; i++) {
    currentRow.push(Markup.button.callback("·", "day_noop"));
  }

  // Day buttons
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let label: string;
    if (dateStr === todayStr) {
      label = `[${day}]`;
    } else if (activeDays.has(day)) {
      label = `•${day}`;
    } else {
      label = `${day}`;
    }
    currentRow.push(Markup.button.callback(label, `day_${dateStr}`));

    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  // Empty trailing slots
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(Markup.button.callback("·", "day_noop"));
    }
    rows.push(currentRow);
  }

  // Back row
  rows.push([Markup.button.callback("🔙 Back to Menu", "menu_back")]);

  return Markup.inlineKeyboard(rows);
}

// Day detail view: Back to Calendar + Back to Menu
export function dayDetailKeyboard(monthKey: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📅 Back to Calendar", `back_calendar_${monthKey}`)],
    [Markup.button.callback("🔙 Back to Menu", "menu_back")],
  ]);
}

// List delete buttons
export function listDeleteKeyboard(expenses: Array<{ id: string; amount: string; currency: string; category?: { name?: string | null } | null }>) {
  const buttons = expenses.map(e => {
    const cat = e.category?.name ?? "Other";
    return Markup.button.callback(`🗑️ ${e.currency} ${e.amount} ${cat}`, `askdelete_${e.id}`);
  });
  const rows: typeof buttons[] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return Markup.inlineKeyboard(rows);
}

import { Markup } from "telegraf";

// Main menu — shown with /start and /menu
export const mainMenuKeyboard = Markup.keyboard([
  ["➕ Add Expense", "📋 Today"],
  ["📊 This Month", "📂 Categories"],
  ["⚙️ Settings", "❓ Help"],
]).resize().persistent();

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

// Today navigation
export function todayNavKeyboard(date: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("◀️ Yesterday", `day_prev_${date}`),
      Markup.button.callback("Today", `day_today_${date}`),
      Markup.button.callback("Tomorrow ▶️", `day_next_${date}`),
    ],
  ]);
}

// List delete buttons
export function listDeleteKeyboard(expenses: Array<{ id: string; amount: string; category?: { name?: string | null } | null }>) {
  const buttons = expenses.map(e => {
    const cat = e.category?.name ?? "Other";
    return Markup.button.callback(`🗑️ $${e.amount} ${cat}`, `askdelete_${e.id}`);
  });
  const rows: typeof buttons[] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return Markup.inlineKeyboard(rows);
}

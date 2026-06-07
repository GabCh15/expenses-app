import { Expense, DailyStats, WeeklyStats, MonthlyStats, CurrencyTotal, LifetimeStats } from "../modules/expenses/types.js";
import { Category } from "../modules/categories/types.js";

function fmtAmount(amount: string | number, currency: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency} ${num.toFixed(2)}`;
}

function fmtCurrencies(currencies: CurrencyTotal[]): string {
  return currencies
    .map((c) => `  ${c.currency} ${parseFloat(c.total).toFixed(2)} (${c.count})`)
    .join("\n");
}

export function welcomeMessage(displayName: string): string {
  return (
    `Hello, ${displayName}! Welcome to Expense.\n\n` +
    `Use the menu below:\n\n` +
    `➕ Add Expense — Log a new expense\n` +
    `📋 Today — Today's summary\n` +
    `📊 Lifetime — All-time stats\n` +
    `⚙️ Settings — Your account info\n\n` +
    `You can also send me a message like "spent 250 on lunch" and I'll try to understand it.`
  );
}

export function helpMessage(): string {
  return (
    `Available commands:\n\n` +
    `/start — Welcome message\n` +
    `/help — This help message\n` +
    `/add <amount> <category> [description] — Log an expense (alias: /expense)\n` +
    `/list [N] — Recent expenses (default 10, max 50)\n` +
    `/today — Today's expenses\n` +
    `/week — Current week breakdown\n` +
    `/month — Current month overview\n` +
    `/categories — List your categories\n` +
    `/report [day|week|month] — Period report\n` +
    `/delete <id> — Delete an expense\n` +
    `/edit <id> amount <value> — Update amount\n` +
    `/edit <id> category <value> — Update category\n` +
    `/edit <id> description <value> — Update description\n` +
    `/link — Generate a token to link your web account`
  );
}

export function expenseCreated(expense: Expense): string {
  const category = expense.category?.name ?? "Other";
  const desc = expense.description ? ` — ${expense.description}` : "";
  return `Expense created: ${fmtAmount(expense.amount, expense.currency)} in ${category}${desc}`;
}

export function expenseList(expenses: Expense[], total: number): string {
  if (expenses.length === 0) {
    return "You have no expenses yet.";
  }
  const lines = expenses.map((e) => {
    const cat = e.category?.name ?? "Other";
    const desc = e.description ? ` — ${e.description}` : "";
    return `${e.expenseDate} — ${fmtAmount(e.amount, e.currency)} | ${cat}${desc}`;
  });
  lines.push(`\nTotal items: ${expenses.length}`);
  return lines.join("\n");
}

export function dailySummary(stats: DailyStats, items?: Expense[]): string {
  if (stats.count === 0) {
    return "You have no expenses today.";
  }
  const totalBlock = stats.currencies.length > 0
    ? `Total:\n${fmtCurrencies(stats.currencies)}`
    : `Total: $${stats.total}`;
  const dayAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(stats.date + 'T00:00:00').getDay()];
  let msg = `📅 ${dayAbbr} ${stats.date}\n${stats.count} expenses\n${totalBlock}`;
  if (items && items.length > 0) {
    const lines = items.map((e) => {
      const cat = e.category?.name ?? "Other";
      const desc = e.description ? ` — ${e.description}` : "";
      return `${fmtAmount(e.amount, e.currency)} | ${cat}${desc}`;
    });
    msg = `${lines.join("\n")}\n\n${msg}`;
  }
  return msg;
}

export function weeklySummary(stats: WeeklyStats): string {
  if (stats.count === 0) {
    return "No expenses this week.";
  }
  const lines = stats.days
    .filter((d) => d.count > 0)
    .map((d) => {
      const dayTotal = fmtCurrencies(d.currencies);
      return `${d.date}\n${dayTotal}`;
    });
  if (lines.length === 0) lines.push("No expenses this week.");
  const weekTotal = stats.currencies.length > 0
    ? `Week total:\n${fmtCurrencies(stats.currencies)}`
    : `Week total: $${stats.total}`;
  lines.push(`\n${weekTotal}\n${stats.count} expenses`);
  return lines.join("\n");
}

export function monthlySummary(stats: MonthlyStats): string {
  if (stats.count === 0) {
    return "No expenses this month.";
  }
  const totalBlock = stats.currencies.length > 0
    ? `Total:\n${fmtCurrencies(stats.currencies)}`
    : `Total: $${stats.total}`;
  return (
    `Month: ${stats.month}\n` +
    `${totalBlock}\n` +
    `Expenses: ${stats.count}`
  );
}

export function lifetimeSummary(stats: LifetimeStats): string {
  if (stats.totalCount === 0) {
    return "You have no expenses yet.";
  }

  const currencyBlock = stats.currencies.length > 0
    ? `Total:\n${fmtCurrencies(stats.currencies)}`
    : "Total: $0.00";

  let msg = `📊 All-Time\n${currencyBlock}\n${stats.totalCount} expenses`;

  if (stats.topCategories.length > 0) {
    const topLines = stats.topCategories.map(
      (c) => `  ${c.categoryName ?? "Uncategorized"}: $${parseFloat(c.total).toFixed(2)}`
    );
    msg += `\n\nTop Categories:\n${topLines.join("\n")}`;
  }

  return msg;
}

export function categoryList(categories: Category[]): string {
  if (categories.length === 0) {
    return "You have no categories.";
  }
  return categories.map((c) => `${c.icon ?? "•"} ${c.name}`).join("\n");
}

export function reportSummary(stats: {
  period: string;
  total: string;
  count: number;
  topCategories: { name: string; total: string; percentage: number }[];
  comparison?: string;
}): string {
  const lines = [
    `Report: ${stats.period}`,
    `Total: $${stats.total}`,
    `Expenses: ${stats.count}`,
  ];
  if (stats.topCategories.length > 0) {
    lines.push("\nTop categories:");
    for (const c of stats.topCategories) {
      lines.push(`  ${c.name}: $${c.total} (${c.percentage}%)`);
    }
  }
  if (stats.comparison) {
    lines.push(`\n${stats.comparison}`);
  }
  return lines.join("\n");
}

export function deleteConfirmation(expense: Expense): string {
  const cat = expense.category?.name ?? "Other";
  return (
    `Delete this expense?\n\n` +
    `${fmtAmount(expense.amount, expense.currency)} in ${cat} — ${expense.description ?? "No description"}\n\n` +
    `Send /delete ${expense.id} to confirm.`
  );
}

export function linkTokenMessage(token: string): string {
  return (
    `Your link code: *${token}*\n\n` +
    `Enter this code on the web dashboard to link your account. It expires in 5 minutes.`
  );
}

export function errorMessage(): string {
  return "Oops, something went wrong. Please try again later.";
}

export function notFoundMessage(): string {
  return "Expense not found.";
}

export function enterAmount(): string {
  return "💰 Enter the amount:";
}

export function selectCategory(): string {
  return "📂 Select a category:";
}

export function selectCurrency(): string {
  return "💱 Select currency:";
}

export function enterDescription(): string {
  return "📝 Enter a description (or /skip):";
}

export function addCanceled(): string {
  return "❌ Add canceled.";
}

export function expenseDeleted(id: string): string {
  return `🗑️ Expense ${id} deleted.`;
}

export function expenseConfirmPreview(data: {
  amount: number;
  categoryName: string;
  currency: string;
  description?: string;
}): string {
  const desc = data.description ? `\nDescription: ${data.description}` : "";
  return (
    `Please confirm your expense:\n\n` +
    `Amount: ${data.amount}\n` +
    `Category: ${data.categoryName}\n` +
    `Currency: ${data.currency}${desc}`
  );
}

export function expenseSaved(): string {
  return "✅ Expense saved!";
}

export function keepExpense(): string {
  return "👍 Expense kept.";
}

export function mainMenuText(): string {
  return "What would you like to do?";
}

export function noExpenses(): string {
  return "You have no expenses yet.";
}

export function settingsInfo(data: {
  displayName: string;
  telegramLinked: boolean;
}): string {
  const linked = data.telegramLinked ? "Yes ✅" : "No — use /link to connect";
  return (
    `⚙️ Settings\n\n` +
    `Name: ${data.displayName}\n` +
    `Web linked: ${linked}`
  );
}

import { Telegraf } from "telegraf";
import { BotContext } from "./types.js";
import { parseWithLLM } from "./llm.js";
import type { MonthlyStats } from "../modules/expenses/types.js";
import * as messages from "./messages.js";
import * as keyboards from "./keyboards.js";
import { buildCalendarKeyboard, dayDetailKeyboard } from "./keyboards.js";

function getMessageText(ctx: BotContext): string | undefined {
  if (ctx.message && "text" in ctx.message) {
    return ctx.message.text;
  }
  return undefined;
}

function getChatId(ctx: BotContext): string | undefined {
  const id = ctx.chat?.id ?? ctx.callbackQuery?.message?.chat.id;
  if (id === undefined) return undefined;
  return String(id);
}

async function getOrCreateUser(ctx: BotContext) {
  const from = ctx.message?.from ?? ctx.callbackQuery?.from;
  if (!from) throw new Error("No user");
  return ctx.services.authService.findOrCreateFromTelegram({
    telegramId: from.id,
    displayName: from.first_name || "User",
  });
}

interface PendingExpense {
  step: "amount" | "category" | "currency" | "description" | "confirm";
  amount?: number;
  categoryId?: string;
  currency?: string;
  description?: string;
}

const pendingExpenses = new Map<string, PendingExpense>();

function clearPending(chatId: string) {
  pendingExpenses.delete(chatId);
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function calendarText(year: number, month: number): string {
  return `📅 ${MONTH_NAMES[month - 1]} ${year}`;
}

function getActiveDays(stats: MonthlyStats): Set<number> {
  const active = new Set<number>();
  for (const day of stats.days) {
    if (day.count > 0) {
      const dayNum = parseInt(day.date.split("-")[2], 10);
      active.add(dayNum);
    }
  }
  return active;
}

async function showCalendar(ctx: BotContext, date: Date): Promise<void> {
  const user = await getOrCreateUser(ctx);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const stats = await ctx.services.expenseService.getMonthlyStats(
    user.id,
    year,
    month
  );

  const activeDays = getActiveDays(stats);
  const todayStr = formatDate(new Date());

  await ctx.reply(
    calendarText(year, month),
    buildCalendarKeyboard(year, month, activeDays, todayStr)
  );
}

async function navigateCalendar(
  ctx: BotContext,
  year: number,
  month: number
): Promise<void> {
  const user = await getOrCreateUser(ctx);

  const stats = await ctx.services.expenseService.getMonthlyStats(
    user.id,
    year,
    month
  );

  const activeDays = getActiveDays(stats);
  const todayStr = formatDate(new Date());

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    calendarText(year, month),
    buildCalendarKeyboard(year, month, activeDays, todayStr)
  );
}

// --- Old text-based add (kept for /gasto alias fallback) ---
async function handleAddText(ctx: BotContext) {
  const from = ctx.message?.from;
  if (!from) return;

  const text = getMessageText(ctx);
  if (!text) return;

  const argsText = text.split(/\s+/).slice(1).join(" ");
  if (!argsText) {
    await ctx.reply("Usage: /add <amount> <category> [description] [USD|COP|EUR]");
    return;
  }

  try {
    const user = await getOrCreateUser(ctx);

    const categories = await ctx.services.categoryService.list(user.id);
    if (categories.length === 0) {
      await ctx.services.categoryService.seedDefaults(user.id);
      categories.push(...(await ctx.services.categoryService.list(user.id)));
    }

    const parsed = await parseWithLLM(argsText, categories);

    if (!parsed || Number.isNaN(parsed.amount)) {
      await ctx.reply(
        "I couldn't understand the amount. Example: /add 250 groceries lunch"
      );
      return;
    }

    await startLLMGuidedFlow(
      ctx,
      categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "📁" })),
      parsed
    );
  } catch {
    await ctx.reply(messages.errorMessage());
  }
}

// --- Step-by-step add flow ---
async function startAddFlow(ctx: BotContext) {
  const chatId = getChatId(ctx);
  if (!chatId) return;
  clearPending(chatId);
  pendingExpenses.set(chatId, { step: "amount" });
  await ctx.reply(messages.enterAmount(), keyboards.flowCancelKeyboard);
}

async function startGuidedAdd(ctx: BotContext, hint: string) {
  const chatId = getChatId(ctx);
  if (!chatId) return;
  clearPending(chatId);
  pendingExpenses.set(chatId, { step: "amount", description: hint });
  await ctx.reply(
    `💰 I understood "${hint}". How much did you spend?\n\nEnter the amount:`,
    keyboards.flowCancelKeyboard
  );
}

async function startLLMGuidedFlow(
  ctx: BotContext,
  categories: Array<{ id: string; name: string; icon: string }>,
  parsed: { amount: number; currency: string | null; categoryId: string | null; description: string | null }
) {
  const chatId = getChatId(ctx);
  if (!chatId) return;
  clearPending(chatId);

  const pending: PendingExpense = {
    step: "confirm",
    amount: parsed.amount,
    categoryId: parsed.categoryId ?? undefined,
    currency: parsed.currency ?? undefined,
    description: parsed.description ?? undefined,
  };

  // Route to earliest missing field
  if (!parsed.currency) {
    pending.step = "currency";
  } else if (!parsed.categoryId) {
    pending.step = "category";
  }

  pendingExpenses.set(chatId, pending);

  if (pending.step === "currency") {
    await ctx.reply(messages.selectCurrency(), keyboards.currencyKeyboard);
  } else if (pending.step === "category") {
    await ctx.reply(
      messages.selectCategory(),
      keyboards.categoryKeyboard(categories)
    );
  } else {
    // All fields present — go straight to confirm
    const category = categories.find((c) => c.id === pending.categoryId);
    await ctx.reply(
      messages.expenseConfirmPreview({
        amount: pending.amount ?? 0,
        categoryName: category?.name ?? "Other",
        currency: pending.currency ?? "USD",
        description: pending.description || undefined,
      }),
      keyboards.confirmKeyboard(chatId)
    );
  }
}

async function handlePendingAmount(ctx: BotContext, text: string) {
  const chatId = getChatId(ctx);
  if (!chatId) return;

  const amount = parseFloat(text.replace(/,/g, ""));
  if (Number.isNaN(amount) || amount <= 0) {
    await ctx.reply("Please enter a valid positive number.");
    return;
  }

  try {
    const user = await getOrCreateUser(ctx);
    const categories = await ctx.services.categoryService.list(user.id);
    if (categories.length === 0) {
      await ctx.services.categoryService.seedDefaults(user.id);
      categories.push(...(await ctx.services.categoryService.list(user.id)));
    }

    const prev = pendingExpenses.get(chatId);
    pendingExpenses.set(chatId, {
      step: "category",
      amount,
      description: prev?.description,
    });
    await ctx.reply(
      messages.selectCategory(),
      keyboards.categoryKeyboard(
        categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "📁" }))
      )
    );
  } catch {
    await ctx.reply(messages.errorMessage());
  }
}

async function handlePendingDescription(ctx: BotContext, text: string) {
  const chatId = getChatId(ctx);
  if (!chatId) return;

  const pending = pendingExpenses.get(chatId);
  if (!pending || pending.step !== "description") return;

  const description = text === "/skip" ? undefined : text;
  pendingExpenses.set(chatId, { ...pending, step: "confirm", description });

  try {
    const user = await getOrCreateUser(ctx);
    const categories = await ctx.services.categoryService.list(user.id);
    const category = categories.find((c) => c.id === pending.categoryId);

    await ctx.reply(
      messages.expenseConfirmPreview({
        amount: pending.amount ?? 0,
        categoryName: category?.name ?? "Other",
        currency: pending.currency ?? "USD",
        description: description || undefined,
      }),
      keyboards.confirmKeyboard(chatId)
    );
  } catch {
    await ctx.reply(messages.errorMessage());
  }
}

// --- Command registration ---
export function registerCommands(bot: Telegraf<BotContext>) {
  bot.command("start", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const categories = await ctx.services.categoryService.list(user.id);
      if (categories.length === 0) {
        await ctx.services.categoryService.seedDefaults(user.id);
      }

      await ctx.reply(
        messages.welcomeMessage(user.displayName),
        keyboards.mainMenuKeyboard
      );
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply(messages.mainMenuText(), keyboards.mainMenuKeyboard);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(messages.helpMessage());
  });

  bot.command("add", async (ctx) => {
    await startAddFlow(ctx);
  });

  bot.command("gasto", async (ctx) => {
    await handleAddText(ctx);
  });

  bot.command("cancel", async (ctx) => {
    const chatId = getChatId(ctx);
    if (chatId) clearPending(chatId);
    await ctx.reply(messages.addCanceled(), keyboards.mainMenuKeyboard);
  });

  bot.command("list", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    const text = getMessageText(ctx);
    const args = text?.split(/\s+/).slice(1) ?? [];
    const limit = args[0]
      ? Math.min(Math.max(parseInt(args[0], 10) || 10, 1), 50)
      : 10;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const result = await ctx.services.expenseService.list(user.id, {
        page: 1,
        limit,
        sort: "date_desc",
      });

      if (result.items.length === 0) {
        await ctx.reply(messages.noExpenses());
        return;
      }

      const total = result.items.reduce(
        (sum, e) => sum + parseFloat(e.amount),
        0
      );
      await ctx.reply(messages.expenseList(result.items, total));
      await ctx.reply(
        "Tap to delete an expense:",
        keyboards.listDeleteKeyboard(result.items)
      );
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("today", async (ctx) => {
    try {
      await showCalendar(ctx, new Date());
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("week", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const now = new Date();
      const day = now.getDay(); // 0 = Sun
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff))
        .toISOString()
        .split("T")[0];

      const stats = await ctx.services.expenseService.getWeeklyStats(
        user.id,
        weekStart
      );
      await ctx.reply(messages.weeklySummary(stats));
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("month", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const now = new Date();
      const stats = await ctx.services.expenseService.getMonthlyStats(
        user.id,
        now.getFullYear(),
        now.getMonth() + 1
      );
      await ctx.reply(messages.monthlySummary(stats));
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("categories", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const categories = await ctx.services.categoryService.list(user.id);
      await ctx.reply(messages.categoryList(categories));
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("report", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    const text = getMessageText(ctx);
    const args = text?.split(/\s+/).slice(1) ?? [];
    const period = args[0] || "month";

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const now = new Date();
      let fromDate: Date;
      let toDate: Date;

      if (period === "day" || period === "today") {
        fromDate = new Date(now.toISOString().split("T")[0]);
        toDate = new Date(fromDate);
      } else if (period === "week") {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        fromDate = new Date(now.setDate(diff));
        toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + 6);
      } else {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const breakdown = await ctx.services.expenseService.getCategoryBreakdown(
        user.id,
        fromDate.toISOString().split("T")[0],
        toDate.toISOString().split("T")[0]
      );

      const total = breakdown.reduce(
        (sum, c) => sum + parseFloat(c.total),
        0
      );
      const count = breakdown.reduce((sum, c) => sum + c.count, 0);
      const top = breakdown
        .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
        .slice(0, 3);

      await ctx.reply(
        messages.reportSummary({
          period,
          total: total.toFixed(2),
          count,
          topCategories: top.map((c) => ({
            name: c.categoryName ?? "Uncategorized",
            total: c.total,
            percentage: c.percentage,
          })),
        })
      );
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("delete", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    const text = getMessageText(ctx);
    const args = text?.split(/\s+/).slice(1) ?? [];
    const id = args[0];

    if (!id) {
      await ctx.reply("Usage: /delete <id>");
      return;
    }

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const expense = await ctx.services.expenseService.getById(user.id, id);
      await ctx.services.expenseService.delete(user.id, id);
      await ctx.reply(
        `Deleted: ${expense.currency} ${expense.amount} in ${expense.category?.name ?? "Other"}`
      );
    } catch (err: any) {
      if (err?.message?.includes("not found")) {
        await ctx.reply(messages.notFoundMessage());
      } else {
        await ctx.reply(messages.errorMessage());
      }
    }
  });

  bot.command("edit", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    const text = getMessageText(ctx);
    const args = text?.split(/\s+/).slice(1) ?? [];

    if (args.length < 3) {
      await ctx.reply("Usage: /edit <id> <field> <value>");
      return;
    }

    const [id, field, ...valueParts] = args;
    const value = valueParts.join(" ");

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const update: {
        amount?: number;
        categoryId?: string;
        description?: string;
      } = {};

      if (field === "amount") {
        const num = parseFloat(value);
        if (Number.isNaN(num) || num <= 0) {
          await ctx.reply("Amount must be a positive number.");
          return;
        }
        update.amount = num;
      } else if (field === "category") {
        const categories = await ctx.services.categoryService.list(user.id);
        const matched = categories.find(
          (c) => c.name.toLowerCase() === value.toLowerCase()
        );
        if (!matched) {
          await ctx.reply(`Category "${value}" not found.`);
          return;
        }
        update.categoryId = matched.id;
      } else if (field === "description") {
        update.description = value;
      } else {
        await ctx.reply("Valid fields: amount, category, description");
        return;
      }

      await ctx.services.expenseService.update(user.id, id, update);
      await ctx.reply("Expense updated.");
    } catch (err: any) {
      if (err?.message?.includes("not found")) {
        await ctx.reply(messages.notFoundMessage());
      } else {
        await ctx.reply(messages.errorMessage());
      }
    }
  });

  bot.command("link", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    try {
      await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const token = await ctx.services.linkService.generateToken(from.id);
      await ctx.reply(messages.linkTokenMessage(token));
    } catch (err: any) {
      if (err?.message?.includes("Too many attempts")) {
        await ctx.reply("Too many attempts. Please try again later.");
      } else {
        await ctx.reply(messages.errorMessage());
      }
    }
  });
}

// --- Callback query handlers ---
export function registerActions(bot: Telegraf<BotContext>) {
  bot.action("menu_back", async (ctx) => {
    const chatId = getChatId(ctx);
    if (chatId) clearPending(chatId);
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch { /* ignore */ }
    await ctx.reply(messages.mainMenuText(), keyboards.mainMenuKeyboard);
  });

  bot.action(/cat_(.+)/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const pending = pendingExpenses.get(chatId);
    if (!pending || pending.step !== "category") {
      await ctx.answerCbQuery("No active add flow.");
      return;
    }

    const categoryId = ctx.match[1];
    const nextStep = pending.currency ? "confirm" : "currency";
    pendingExpenses.set(chatId, { ...pending, step: nextStep, categoryId });

    await ctx.answerCbQuery("Category selected");
    await ctx.editMessageReplyMarkup(undefined);

    if (nextStep === "confirm") {
      const user = await getOrCreateUser(ctx);
      const categories = await ctx.services.categoryService.list(user.id);
      const category = categories.find((c) => c.id === categoryId);
      await ctx.reply(
        messages.expenseConfirmPreview({
          amount: pending.amount ?? 0,
          categoryName: category?.name ?? "Other",
          currency: pending.currency ?? "USD",
          description: pending.description || undefined,
        }),
        keyboards.confirmKeyboard(chatId)
      );
    } else {
      await ctx.reply(messages.selectCurrency(), keyboards.currencyKeyboard);
    }
  });

  bot.action(/cur_(.+)/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const pending = pendingExpenses.get(chatId);
    if (!pending || pending.step !== "currency") {
      await ctx.answerCbQuery("No active add flow.");
      return;
    }

    const currency = ctx.match[1];
    // If all fields are filled, go straight to confirm
    const nextStep = (pending.categoryId) ? "confirm" : "description";
    pendingExpenses.set(chatId, { ...pending, step: nextStep, currency });

    await ctx.answerCbQuery("Currency selected");
    await ctx.editMessageReplyMarkup(undefined);

    if (nextStep === "confirm") {
      const user = await getOrCreateUser(ctx);
      const categories = await ctx.services.categoryService.list(user.id);
      const category = categories.find((c) => c.id === pending.categoryId);
      await ctx.reply(
        messages.expenseConfirmPreview({
          amount: pending.amount ?? 0,
          categoryName: category?.name ?? "Other",
          currency,
          description: pending.description || undefined,
        }),
        keyboards.confirmKeyboard(chatId)
      );
    } else {
      await ctx.reply(messages.enterDescription(), keyboards.flowCancelKeyboard);
    }
  });

  bot.action(/confirm_(.+)/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const pending = pendingExpenses.get(chatId);
    if (!pending || pending.step !== "confirm") {
      await ctx.answerCbQuery("Nothing to confirm.");
      return;
    }

    try {
      const user = await getOrCreateUser(ctx);

      const expense = await ctx.services.expenseService.create(
        user.id,
        {
          amount: pending.amount ?? 0,
          categoryId: pending.categoryId ?? "",
          description: pending.description ?? undefined,
          expenseDate: new Date().toISOString(),
          currency: (pending.currency ?? "USD") as "USD" | "COP" | "EUR",
        },
        "telegram"
      );

      clearPending(chatId);
      await ctx.answerCbQuery("Expense saved!");
      await ctx.editMessageReplyMarkup(undefined);
      await ctx.reply(messages.expenseSaved());
      await ctx.reply(messages.expenseCreated(expense), keyboards.mainMenuKeyboard);
    } catch {
      await ctx.answerCbQuery("Error saving expense.");
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.action(/cancel_(.+)/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (chatId) clearPending(chatId);
    await ctx.answerCbQuery("Canceled");
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {
      // ignore if message can't be edited
    }
    await ctx.reply(messages.addCanceled(), keyboards.mainMenuKeyboard);
  });

  bot.action(/delete_(.+)/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const expenseId = ctx.match[1];

    try {
      const user = await getOrCreateUser(ctx);
      const expense = await ctx.services.expenseService.getById(user.id, expenseId);
      await ctx.services.expenseService.delete(user.id, expenseId);
      await ctx.answerCbQuery("Deleted");
      await ctx.editMessageReplyMarkup(undefined);
      await ctx.reply(
        messages.expenseDeleted(expenseId) +
          `\nDeleted: ${expense.currency} ${expense.amount} in ${expense.category?.name ?? "Other"}`
      );
    } catch (err: any) {
      if (err?.message?.includes("not found")) {
        await ctx.answerCbQuery("Expense not found.");
        await ctx.reply(messages.notFoundMessage());
      } else {
        await ctx.answerCbQuery("Error deleting expense.");
        await ctx.reply(messages.errorMessage());
      }
    }
  });

  bot.action(/keep_(.+)/, async (ctx) => {
    await ctx.answerCbQuery("Kept");
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(messages.keepExpense(), keyboards.mainMenuKeyboard);
  });

  bot.action(/askdelete_(.+)/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const expenseId = ctx.match[1];

    try {
      const user = await getOrCreateUser(ctx);
      const expense = await ctx.services.expenseService.getById(user.id, expenseId);
      await ctx.answerCbQuery();
      await ctx.editMessageReplyMarkup(undefined);
      await ctx.reply(
        messages.deleteConfirmation(expense),
        keyboards.deleteConfirmKeyboard(expenseId)
      );
    } catch (err: any) {
      if (err?.message?.includes("not found")) {
        await ctx.answerCbQuery("Expense not found.");
        await ctx.reply(messages.notFoundMessage());
      } else {
        await ctx.answerCbQuery("Error");
        await ctx.reply(messages.errorMessage());
      }
    }
  });

  // --- Calendar callbacks ---

  bot.action("day_noop", async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(/day_(\d{4}-\d{2}-\d{2})/, async (ctx) => {
    const dateStr = ctx.match[1];

    try {
      const user = await getOrCreateUser(ctx);
      console.log(`[Calendar] day click: dateStr=${dateStr}, userId=${user.id}`);
      const stats = await ctx.services.expenseService.getDailyStats(
        user.id,
        dateStr
      );
      const listResult = await ctx.services.expenseService.list(user.id, {
        page: 1,
        limit: 100,
        sort: "date_desc",
        from: dateStr,
        to: dateStr,
      });

      const monthKey = dateStr.slice(0, 7); // "YYYY-MM"
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        messages.dailySummary(stats, listResult.items),
        dayDetailKeyboard(monthKey)
      );
    } catch {
      await ctx.answerCbQuery("Error loading day.");
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.action(/month_prev_(\d{4}-\d{2})/, async (ctx) => {
    const [yearStr, monthStr] = ctx.match[1].split("-");
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);

    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }

    await navigateCalendar(ctx, year, month);
  });

  bot.action(/month_next_(\d{4}-\d{2})/, async (ctx) => {
    const [yearStr, monthStr] = ctx.match[1].split("-");
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    await navigateCalendar(ctx, year, month);
  });

  bot.action(/back_calendar_(\d{4}-\d{2})/, async (ctx) => {
    const [yearStr, monthStr] = ctx.match[1].split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    try {
      const user = await getOrCreateUser(ctx);

      const stats = await ctx.services.expenseService.getMonthlyStats(
        user.id,
        year,
        month
      );

      const activeDays = getActiveDays(stats);
      const todayStr = formatDate(new Date());

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        calendarText(year, month),
        buildCalendarKeyboard(year, month, activeDays, todayStr)
      );
    } catch {
      await ctx.answerCbQuery("Error loading calendar.");
      await ctx.reply(messages.errorMessage());
    }
  });

  // --- Natural language fallback ---
  bot.on("message", async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text;
    if (!text) return;

    const chatId = getChatId(ctx);
    const pending = chatId ? pendingExpenses.get(chatId) : undefined;

    // Allow /skip through when in description step; block other commands
    const isSkipCommand = text === "/skip" && pending?.step === "description";
    if (text.startsWith("/") && !isSkipCommand) return;

    if (chatId && pending) {
      if (text === "❌ Cancel") {
        clearPending(chatId);
        await ctx.reply(messages.addCanceled(), keyboards.mainMenuKeyboard);
        return;
      }
      if (pending.step === "amount") {
        await handlePendingAmount(ctx, text);
        return;
      }
      if (pending.step === "description") {
        await handlePendingDescription(ctx, text);
        return;
      }
      // Other steps are handled by callbacks
      await ctx.reply("Please use the buttons or /cancel to abort.");
      return;
    }

    // --- Cancel from flow keyboard (no pending) ---
    if (text === "❌ Cancel") {
      const cancelChatId = getChatId(ctx);
      if (cancelChatId) clearPending(cancelChatId);
      await ctx.reply(messages.addCanceled(), keyboards.mainMenuKeyboard);
      return;
    }

    // --- Main menu button handler ---
    if (text === "➕ Add Expense") {
      await startAddFlow(ctx);
      return;
    }
    if (text === "📋 Today") {
      try {
        await showCalendar(ctx, new Date());
      } catch {
        await ctx.reply(messages.errorMessage());
      }
      return;
    }
    if (text === "📊 Lifetime") {
      try {
        const user = await getOrCreateUser(ctx);
        const stats = await ctx.services.expenseService.getLifetimeStats(user.id);
        await ctx.reply(messages.lifetimeSummary(stats));
      } catch {
        await ctx.reply(messages.errorMessage());
      }
      return;
    }
    if (text === "⚙️ Settings") {
      try {
        const user = await getOrCreateUser(ctx);
        await ctx.reply(messages.settingsInfo({
          displayName: user.displayName,
          telegramLinked: user.telegramLinked,
        }), keyboards.backToMenuInline);
      } catch {
        await ctx.reply(messages.errorMessage());
      }
      return;
    }

    const from = ctx.message.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const categories = await ctx.services.categoryService.list(user.id);
      if (categories.length === 0) {
        await ctx.services.categoryService.seedDefaults(user.id);
        categories.push(...(await ctx.services.categoryService.list(user.id)));
      }

      const parsed = await parseWithLLM(text, categories);

      if (!parsed || Number.isNaN(parsed.amount)) {
        await startGuidedAdd(ctx, text);
        return;
      }

      await startLLMGuidedFlow(
        ctx,
        categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "📁" })),
        parsed
      );
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });
}

import { Telegraf } from "telegraf";
import { BotContext } from "./types.js";
import { parseExpense, parseFreeForm } from "./parser.js";
import * as messages from "./messages.js";

function getMessageText(ctx: BotContext): string | undefined {
  if (ctx.message && "text" in ctx.message) {
    return ctx.message.text;
  }
  return undefined;
}

async function handleAdd(ctx: BotContext) {
  const from = ctx.message?.from;
  if (!from) return;

  const text = getMessageText(ctx);
  if (!text) return;

  const argsText = text.split(/\s+/).slice(1).join(" ");
  if (!argsText) {
    await ctx.reply("Usage: /add <amount> <category> [description]");
    return;
  }

  try {
    const user = await ctx.services.authService.findOrCreateFromTelegram({
      telegramId: from.id,
      displayName: from.first_name || "User",
    });

    const categories = await ctx.services.categoryService.list(user.id);
    let parsed = parseExpense(argsText, categories);

    if (!parsed) {
      parsed = parseFreeForm(argsText, categories);
    }

    if (!parsed) {
      await ctx.reply(
        "I couldn't understand the amount. Example: /add 250 groceries lunch"
      );
      return;
    }

    let categoryId = parsed.categoryId;
    if (!categoryId) {
      const other = categories.find((c) => c.name.toLowerCase() === "other");
      categoryId = other?.id ?? categories[0]?.id ?? null;
    }

    if (!categoryId) {
      await ctx.reply(
        "No category available. Please use /categories to set up categories."
      );
      return;
    }

    const expense = await ctx.services.expenseService.create(
      user.id,
      {
        amount: parsed.amount,
        categoryId,
        description: parsed.description ?? undefined,
        expenseDate: new Date().toISOString(),
      },
      "telegram"
    );

    await ctx.reply(messages.expenseCreated(expense));
  } catch {
    await ctx.reply(messages.errorMessage());
  }
}

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

      await ctx.reply(messages.welcomeMessage(user.displayName));
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(messages.helpMessage());
  });

  bot.command("add", async (ctx) => {
    await handleAdd(ctx);
  });

  bot.command("gasto", async (ctx) => {
    await handleAdd(ctx);
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
      });

      const total = result.items.reduce(
        (sum, e) => sum + parseFloat(e.amount),
        0
      );
      await ctx.reply(messages.expenseList(result.items, total));
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });

  bot.command("today", async (ctx) => {
    const from = ctx.message?.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const today = new Date().toISOString().split("T")[0];
      const stats = await ctx.services.expenseService.getDailyStats(
        user.id,
        today
      );

      const listResult = await ctx.services.expenseService.list(user.id, {
        page: 1,
        limit: 100,
        from: `${today}T00:00:00.000Z`,
        to: `${today}T23:59:59.999Z`,
      });

      await ctx.reply(messages.dailySummary(stats, listResult.items));
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
        `Deleted: $${expense.amount} in ${expense.category?.name ?? "Other"}`
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

  // Natural language fallback for non-command text messages
  bot.on("message", async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text;
    if (!text || text.startsWith("/")) return;

    const from = ctx.message.from;
    if (!from) return;

    try {
      const user = await ctx.services.authService.findOrCreateFromTelegram({
        telegramId: from.id,
        displayName: from.first_name || "User",
      });

      const categories = await ctx.services.categoryService.list(user.id);
      let parsed = parseExpense(text, categories);
      if (!parsed) {
        parsed = parseFreeForm(text, categories);
      }

      if (!parsed) {
        await ctx.reply(
          'I couldn\'t understand that. Try /help for examples, or send "add <amount> <category> [description]".'
        );
        return;
      }

      let categoryId = parsed.categoryId;
      if (!categoryId) {
        const other = categories.find((c) => c.name.toLowerCase() === "other");
        categoryId = other?.id ?? categories[0]?.id ?? null;
      }

      if (!categoryId) {
        await ctx.reply(
          "No category available. Please use /categories to set up categories."
        );
        return;
      }

      const expense = await ctx.services.expenseService.create(
        user.id,
        {
          amount: parsed.amount,
          categoryId,
          description: parsed.description ?? undefined,
          expenseDate: new Date().toISOString(),
        },
        "telegram"
      );

      await ctx.reply(messages.expenseCreated(expense));
    } catch {
      await ctx.reply(messages.errorMessage());
    }
  });
}

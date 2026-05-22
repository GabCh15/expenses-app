import { Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { BotContext } from "./types.js";
import { authService, expenseService, categoryService, linkService } from "./services.js";
import { registerCommands } from "./commands.js";

export async function startBot(): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN not set. Bot will not start.");
    return;
  }

  const bot = new Telegraf<BotContext>(token);

  bot.use((ctx, next) => {
    ctx.services = {
      authService,
      expenseService,
      categoryService,
      linkService,
    };
    return next();
  });

  registerCommands(bot);

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  await bot.launch();
  console.log("Bot started (long-polling)");
}

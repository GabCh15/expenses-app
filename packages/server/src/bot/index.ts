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

  bot.catch(async (err) => {
    console.error("Bot error:", err);
    // Graceful handling for Telegram rate limits (429)
    const anyErr = err as any;
    if (anyErr?.response?.error_code === 429) {
      const retryAfter = (anyErr.response.parameters?.retry_after ?? 5) * 1000;
      console.warn(`Telegram rate limit hit. Sleeping ${retryAfter}ms...`);
      await new Promise((res) => setTimeout(res, retryAfter));
    }
  });

  await bot.launch();
  console.log("Bot started (long-polling)");
}

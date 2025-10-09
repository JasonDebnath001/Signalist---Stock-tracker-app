import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { sendWelcomeEmail } from "../nodemailer";
import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompt";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { sendSummaryEmail } from "../nodemailer";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment Goals: ${event.data.investmentGoals}
        - Risk Tolerance: ${event.data.riskTolerance}
        - Preferred Industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{user_profile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist!. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: "Welcome email sent",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Process each user serially to avoid hitting external rate limits
    for (const user of users) {
      try {
        const symbols = await step.run(`get-watchlist-${user.id}`, () =>
          getWatchlistSymbolsByEmail(user.email)
        );

        let news: MarketNewsArticle[] = [];
        try {
          news = await step.run(`fetch-news-${user.id}`, () =>
            getNews(symbols)
          );
        } catch (e) {
          console.log("News fetch failed for user", user.email, e);
          news = [];
        }

        // Limit to 6 articles max
        news = news.slice(0, 6);

        if (!news || news.length === 0) {
          // Nothing to send, skip user
          continue;
        }

        // Summarize news for current user via AI and send email
        try {
          const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
            "{{newsData}}",
            JSON.stringify(news, null, 2)
          );

          const response = await step.ai.infer(`summarize-news-${user.email}`, {
            model: step.ai.models.gemini({ model: "gemini-2.0-flash-lite" }),
            body: { contents: [{ role: "user", parts: [{ text: prompt }] }] },
          });

          const part = response.candidates?.[0]?.content?.parts?.[0];
          const newsContent =
            (part && "text" in part ? part.text : null) || "No market news";

          const date = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          await step.run(`send-summary-email-${user.id}`, async () =>
            sendSummaryEmail({ email: user.email, date, newsContent })
          );
        } catch (error) {
          console.log(
            "Failed to summarize or send news for user",
            user.email,
            error
          );
        }
      } catch (error) {
        console.log("Error preparing daily news for user", user.email, error);
        continue;
      }
    }

    return { success: true };
  }
);

import nodemailer from "nodemailer";
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "./templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro
  );

  const mailOptions = {
    from: "Signalist <proxpressions8@gmail.com>",
    to: email,
    subject: "Welcome to Signalist - Your stock market toolkit is ready!",
    text: "Thanks for joining Signalist.",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendSummaryEmail = async ({
  email,
  date,
  newsContent,
}: SummaryEmailData) => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: "Signalist <proxpressions8@gmail.com>",
    to: email,
    subject: `Market News Summary — ${date}`,
    text: `Market news summary for ${date}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

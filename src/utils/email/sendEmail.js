import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const sendEmail = async (email, subject, payload, template) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Convert import.meta.url to file path
    const currentFilePath = fileURLToPath(import.meta.url);
    const templatePath = path.join(path.dirname(currentFilePath), template);

    const source = fs.readFileSync(templatePath, "utf8");
    const compiledTemplate = handlebars.compile(source);

    const options = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: subject,
      html: compiledTemplate(payload),
    };

    // Send email
    const info = await transporter.sendMail(options);

    return {
      success: true,
      message: `Email sent: ${info.messageId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/*
Example:
sendEmail(
  "youremail@gmail.com",
  "Email subject",
  { name: "Eze" },
  "./templates/layouts/main.handlebars"
);
*/

export { sendEmail };

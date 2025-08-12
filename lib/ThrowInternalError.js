import fs from "fs";
import path from "path";
import { getFormattedDate } from "./dateUtils.js";

export const ThrowInternalError = (req, res, error) => {
  try {
    const date = new Date();
    const formattedDate = getFormattedDate(date, "-");

    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    const formattedHours = date.getHours() % 12 || 12;
    const formattedTime = `${formattedHours}:${date.getMinutes()}:${date.getSeconds()} ${ampm}`;

    const logDir = path.join(process.cwd(), "logs");
    const logFilePath = path.join(logDir, `errors-${formattedDate}.txt`);

    const logEntry = `${formattedDate} - ${formattedTime} - ${req.method} ${req.path}\nError : ${error?.message}\n\n`;
    fs.appendFileSync(logFilePath, logEntry);
  } catch (error) {
    console.log("Error creating Log", error);
  }

  console.log(error);

  return res.status(500).send({
    message: error?.message,
    fullError: error,
  });
};

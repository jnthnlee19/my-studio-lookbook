const nodemailer = require("nodemailer");
const Busboy = require("busboy");
const fs = require("fs");
const os = require("os");
const path = require("path");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: { "content-type": event.headers["content-type"] },
    });

    let address = "";
    let filePath = "";
    let fileWriteStream;

    busboy.on("file", (fieldname, file, filename) => {
      filePath = path.join(os.tmpdir(), filename);
      fileWriteStream = fs.createWriteStream(filePath);
      file.pipe(fileWriteStream);
    });

    busboy.on("field", (fieldname, value) => {
      if (fieldname === "address") address = value;
    });

    busboy.on("finish", async () => {
      if (!filePath || !address) {
        return resolve({
          statusCode: 400,
          body: "Missing file or address",
        });
      }

      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.SENDER_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: process.env.SENDER_EMAIL,
          subject: `New KB Home Selections: ${address}`,
          text: `A customer has submitted their selections for ${address}.`,
          attachments: [
            {
              filename: `${address.replace(/\s+/g, "_")}.pdf`,
              path: filePath,
            },
          ],
        });

        return resolve({
          statusCode: 200,
          body: "PDF received and emailed!",
        });
      } catch (err) {
        console.error("Email error:", err);
        return resolve({
          statusCode: 500,
          body: "Email failed to send",
        });
      }
    });

    const buffer = Buffer.from(event.body, "base64");
    busboy.end(buffer);
  });
};

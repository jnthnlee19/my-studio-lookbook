const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const data = event.body;

  if (!data) {
    return {
      statusCode: 400,
      body: "No data received",
    };
  }

  const boundary = event.headers["content-type"].split("boundary=")[1];
  const bodyBuffer = Buffer.from(event.body, "base64");
  const parts = bodyBuffer.toString().split(`--${boundary}`);

  const pdfPart = parts.find((p) => p.includes("filename=\"my-selections.pdf\""));
  const addressPart = parts.find((p) => p.includes("name=\"address\""));

  if (!pdfPart || !addressPart) {
    return {
      statusCode: 400,
      body: "Missing PDF or address",
    };
  }

  const pdfStart = pdfPart.indexOf("\r\n\r\n") + 4;
  const pdfContent = pdfPart.substring(pdfStart).trimEnd();
  const pdfBuffer = Buffer.from(pdfContent, "binary");

  const addressStart = addressPart.indexOf("\r\n\r\n") + 4;
  const address = addressPart.substring(addressStart).trim();

  const filename = address.replace(/\s+/g, "_").replace(/[^\w\-]/g, "") + ".pdf";
  const savePath = path.join("/tmp", filename);

  fs.writeFileSync(savePath, pdfBuffer);

  // Send email (example: using test Gmail setup — adjust as needed)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to: process.env.SENDER_EMAIL, // or a real recipient if known
    subject: `New KB Home Selections: ${address}`,
    text: `A customer has submitted their selections for ${address}.`,
    attachments: [{ filename, path: savePath }],
  });

  return {
    statusCode: 200,
    body: "PDF received and emailed",
  };
};

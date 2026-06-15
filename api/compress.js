import { PDFDocument } from "pdf-lib";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  try {
    // 🔥 RAW BODY FIX
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const file = body?.file;

    if (!file) {
      return res.status(400).send("No file received");
    }

    const pdfBytes = Buffer.from(file, "base64");

    const pdfDoc = await PDFDocument.load(pdfBytes);

    const optimized = await pdfDoc.save({
      useObjectStreams: true
    });

    res.setHeader("Content-Type", "application/pdf");

    return res.send(Buffer.from(optimized));

  } catch (err) {
    console.error(err);

    return res.status(500).send("Compression error: " + err.message);
  }
}

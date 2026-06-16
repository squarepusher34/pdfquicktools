import { PDFDocument } from "pdf-lib";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  try {
    const { file } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file received" });
    }

    // base64 -> buffer
    const pdfBytes = Buffer.from(file, "base64");

    // load pdf
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // optimize
    const compressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const output = Buffer.from(compressed);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=compressed.pdf");

    return res.send(output);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
    });
  }
}

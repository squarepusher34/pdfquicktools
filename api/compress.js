import fetch from "node-fetch";

async function getToken() {
  const res = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.ADOBE_CLIENT_ID,
      client_secret: process.env.ADOBE_CLIENT_SECRET,
      scope: "openid,AdobeID,DCAPI",
    }),
  });

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST" });
  }

  try {
    const { file } = req.body;
    if (!file) return res.status(400).json({ error: "No file" });

    const token = await getToken();

    const pdfBuffer = Buffer.from(file, "base64");

    // 1. Upload + compress job başlat
    const response = await fetch(
      "https://cpf-ue1.adobe.io/operation/compresspdf",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/pdf",
        },
        body: pdfBuffer,
      }
    );

    const data = await response.json();

    // 🔥 BURASI ÖNEMLİ
    return res.status(200).json({
      jobId: data.jobId,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

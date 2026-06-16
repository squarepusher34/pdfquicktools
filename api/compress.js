import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" }
  }
};

async function getToken() {
  const res = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.ADOBE_CLIENT_ID,
      client_secret: process.env.ADOBE_CLIENT_SECRET,
      scope: "openid,AdobeID,DCAPI"
    })
  });

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("POST only");

  try {
    const { file } = req.body;
    const token = await getToken();

    const buffer = Buffer.from(file, "base64");

    const upload = await fetch("https://cpf-ue1.adobe.io/assets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf"
      },
      body: buffer
    });

    const uploadData = await upload.json();
    const assetId = uploadData.assetID;

    const job = await fetch("https://cpf-ue1.adobe.io/operation/compresspdf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ assetID: assetId })
    });

    const jobData = await job.json();

    return res.status(200).json({
      jobId: jobData.jobID || jobData.jobId
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

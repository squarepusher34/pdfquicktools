export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

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

  console.log("TOKEN RESPONSE:", data);

  if (!data.access_token) {
    throw new Error("Adobe token alınamadı");
  }

  return data.access_token;
}

export default async function handler(req, res) {
  console.log("API CALLED:", req.method);

  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  try {
    const { file } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file received" });
    }

    const token = await getToken();

    const buffer = Buffer.from(file, "base64");

    console.log("UPLOAD START...");

    // 1) UPLOAD PDF
    const upload = await fetch("https://cpf-ue1.adobe.io/assets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf",
      },
      body: buffer,
    });

    const uploadText = await upload.text();

    let uploadData;
    try {
      uploadData = JSON.parse(uploadText);
    } catch (e) {
      uploadData = { raw: uploadText };
    }

    console.log("UPLOAD RESPONSE:", uploadData);

    const assetId = uploadData.assetID || uploadData.assetId;

    if (!assetId) {
      return res.status(500).json({
        error: "assetID bulunamadı",
        uploadData,
      });
    }

    console.log("ASSET ID:", assetId);

    // 2) CREATE COMPRESS JOB
    const job = await fetch(
      "https://cpf-ue1.adobe.io/operation/compresspdf",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetID: assetId,
        }),
      }
    );

    const jobText = await job.text();

    let jobData;
    try {
      jobData = JSON.parse(jobText);
    } catch (e) {
      jobData = { raw: jobText };
    }

    console.log("JOB RESPONSE:", jobData);

    const jobId = jobData.jobID || jobData.jobId;

    if (!jobId) {
      return res.status(500).json({
        error: "jobId bulunamadı",
        jobData,
      });
    }

    console.log("JOB ID:", jobId);

    return res.status(200).json({ jobId });

  } catch (err) {
    console.error("API ERROR:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
}

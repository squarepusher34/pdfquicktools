import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

async function getAccessToken() {
  const res = await fetch(
    "https://ims-na1.adobelogin.com/ims/token/v3",
    {
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
    }
  );

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  try {
    const { file } = req.body;

    if (!file) {
      return res.status(400).send("No file received");
    }

    const token = await getAccessToken();
    const pdfBuffer = Buffer.from(file, "base64");

    // 1. UPLOAD
    const uploadRes = await fetch(
      "https://cpf-ue1.adobe.io/assets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/pdf",
        },
        body: pdfBuffer,
      }
    );

    const uploadData = await uploadRes.json();

    if (!uploadData.assetID) {
      return res.status(500).json(uploadData);
    }

    const assetId = uploadData.assetID;

    // 2. CREATE JOB
    const jobRes = await fetch(
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

    const jobData = await jobRes.json();

    if (!jobData.jobID && !jobData.jobId) {
      return res.status(500).json(jobData);
    }

    // 3. RETURN JOB (frontend poll yapacak)
    return res.status(200).json({
      message: "Job started",
      jobId: jobData.jobID || jobData.jobId,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send("Compression failed: " + err.message);
  }
}

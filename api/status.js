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
  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: "No jobId" });
  }

  try {
    const token = await getToken();

    const response = await fetch(
      `https://cpf-ue1.adobe.io/operation/${jobId}/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

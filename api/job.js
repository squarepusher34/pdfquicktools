export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.CLOUDCONVERT_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

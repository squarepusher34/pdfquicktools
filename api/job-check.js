export default async function handler(req, res) {
  const jobId = req.query.jobId;

  const apiKey = process.env.CLOUDCONVERT_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    const response = await fetch(
      "https://api.cloudconvert.com/v2/jobs/" + jobId,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

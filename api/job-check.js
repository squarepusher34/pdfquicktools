export default async function handler(req, res) {
  const jobId = req.query.jobId;

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId" });
  }

  try {
    const apiKey = process.env.CLOUDCONVERT_KEY;

    const response = await fetch(
      "https://api.cloudconvert.com/v2/jobs/" + jobId,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

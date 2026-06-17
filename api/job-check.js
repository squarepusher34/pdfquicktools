export default async function handler(req, res) {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    const response = await fetch(
      "https://api.cloudconvert.com/v2/jobs/" + id,
      {
        headers: {
          Authorization: "Bearer " + process.env.CLOUDCONVERT_KEY,
        },
      }
    );

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

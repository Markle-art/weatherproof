export default async function handler(req, res) {
  try {
    const response = await fetch("https://conduit.jhubafrica.com/data.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        apikey: process.env.CONDUIT_API_KEY,
        email: process.env.CONDUIT_EMAIL,
        fromdate: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        todate: new Date().toISOString().slice(0, 10),
      }),
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Conduit request failed",
      })
    }

    const data = await response.json()

    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({
      error: "Unable to reach Conduit",
    })
  }
}

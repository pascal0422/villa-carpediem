const GH_TOKEN = process.env.GH_TOKEN;
const GH_REPO  = 'pascal0422/villa-carpediem';
const GH_FILE  = 'bookings.json';
const GH_API   = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`;

const headers = {
  'Authorization': `token ${GH_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'User-Agent': 'villa-carpediem'
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://villa-carpediem.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET — return bookings (public, no auth needed)
  if (req.method === 'GET') {
    try {
      const r = await fetch(GH_API, { headers });
      if (!r.ok) return res.status(200).json({ bookings: [], sha: null });
      const data = await r.json();
      const bookings = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      return res.status(200).json({ bookings, sha: data.sha });
    } catch (e) {
      return res.status(200).json({ bookings: [], sha: null });
    }
  }

  // ── PUT — update bookings (admin only, requires secret key)
  if (req.method === 'PUT') {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { bookings, sha } = req.body;
      const content = Buffer.from(JSON.stringify(bookings, null, 2)).toString('base64');
      const body = {
        message: 'Update bookings ' + new Date().toISOString().slice(0, 10),
        content,
        sha
      };
      const r = await fetch(GH_API, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!r.ok) {
        const err = await r.json();
        return res.status(500).json({ error: err.message });
      }
      const data = await r.json();
      return res.status(200).json({ sha: data.content.sha });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

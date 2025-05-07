const express = require('express');
const crypto = require('crypto');
const path = require('path');
const app = express();

const BOT_TOKEN = 'YOUR_BOT_TOKEN';
const WEBHOOK_SECRET = crypto.createHash('sha256').update(BOT_TOKEN).digest('hex');

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API endpoint to verify Telegram initData
app.get('/api/user', (req, res) => {
  const initData = req.query.initData;
  if (!verifyTelegramInitData(initData)) {
    return res.status(403).json({ error: 'Invalid initData' });
  }
  const parsed = parseQuery(initData);
  res.json({ id: parsed.user?.id, name: parsed.user?.first_name });
});

function parseQuery(str) {
  return Object.fromEntries(new URLSearchParams(str));
}

function verifyTelegramInitData(initData) {
  const parsed = parseQuery(initData);
  const hash = parsed.hash;
  delete parsed.hash;
  const dataCheckString = Object.keys(parsed)
    .sort()
    .map(key => `${key}=${parsed[key]}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return hmac === hash;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

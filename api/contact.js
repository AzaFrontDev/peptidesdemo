export default async function handler(req, res) {
  // Только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, company, contact, details } = req.body;

  // Валидация на сервере
  if (!name?.trim() || !contact?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const text = buildMessage({
    name:    name.trim(),
    company: company?.trim() || '',
    contact: contact.trim(),
    details: details?.trim() || '',
  });

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    process.env.TG_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!tgRes.ok) {
      const err = await tgRes.text();
      throw new Error(`Telegram ${tgRes.status}: ${err}`);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[contact]', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
}

/* ── Helpers ─────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMessage({ name, company, contact, details }) {
  return [
    '📬 <b>Новая заявка — Peptide Labs</b>',
    '',
    `👤 <b>Имя:</b> ${escHtml(name)}`,
    company ? `🏢 <b>Компания:</b> ${escHtml(company)}` : null,
    `📱 <b>Контакт:</b> ${escHtml(contact)}`,
    details ? `📝 <b>Детали:</b>\n${escHtml(details)}` : null,
    '',
    `⏱ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`,
  ].filter(Boolean).join('\n');
}
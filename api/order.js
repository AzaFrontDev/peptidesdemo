export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, telegram, cart = [], total = 0 } = req.body;

  // Только имя и телефон обязательны
  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const itemsText = cart.length
    ? cart.map(i =>
        `  • ${escHtml(i.name)}, ${escHtml(i.dosage)} × ${i.qty} шт. — ${(i.price * i.qty).toLocaleString('ru-RU')} ₽`
      ).join('\n')
    : '  Корзина пуста — обращение без заказа';

  const text = [
    '📩 <b>Новое обращение — Peptide Labs</b>',
    '',
    `👤 <b>Имя:</b> ${escHtml(name)}`,
    `📱 <b>Телефон:</b> ${escHtml(phone)}`,
    telegram?.trim() ? `✈️ <b>Telegram:</b> @${escHtml(telegram.replace('@', ''))}` : null,
    '',
    '<b>📦 Состав заказа:</b>',
    itemsText,
    '',
    cart.length ? `💰 <b>Итого:</b> ${Number(total).toLocaleString('ru-RU')} ₽` : null,
    '',
    `⏱ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`,
  ].filter(Boolean).join('\n');

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

    if (!tgRes.ok) throw new Error(`Telegram: ${tgRes.status}`);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[order]', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
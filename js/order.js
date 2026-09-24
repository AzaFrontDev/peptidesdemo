'use strict';

/* ── Открытие / Закрытие ─────────────────────────────── */
function openOrderModal() {
  const cart    = getCart();
  const itemsEl = document.getElementById('order-items');
  const totalEl = document.getElementById('order-total-display');

  if (itemsEl) {
    itemsEl.innerHTML = cart.length
      ? cart.map(item => `
          <div class="order-item">
            <span class="order-item__name">${item.name}</span>
            <span class="order-item__meta">${item.dosage} × ${item.qty} шт.</span>
            <span class="order-item__price">
              ${(item.price * item.qty).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        `).join('')
      : '<p class="order-items-empty">Корзина пуста — просто напишите нам</p>';
  }

  if (totalEl) {
    totalEl.textContent = cart.length
      ? getTotal().toLocaleString('ru-RU') + ' ₽'
      : '—';
  }

  document.getElementById('order-modal')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  document.getElementById('order-modal')?.classList.remove('is-open');
  document.body.style.overflow = '';
  document.getElementById('order-form')?.reset();
  setOrderStatus('', '');
}

/* ── Отправка ────────────────────────────────────────── */
function buildOrderMessage({ name, phone, telegram, cart, total }) {
  const lines = [
    '🛒 <b>Новый заказ — Peptide Labs</b>',
    '',
    `👤 <b>Имя:</b> ${esc(name)}`,
    `📱 <b>Телефон:</b> ${esc(phone)}`,
    telegram ? `✈️ <b>Telegram:</b> @${esc(telegram.replace('@', ''))}` : null,
    '',
    cart.length ? '<b>📦 Состав:</b>' : '<b>📦 Состав:</b> не указан',
    ...cart.map(i =>
      `  • ${esc(i.name)}, ${esc(i.dosage)} × ${i.qty} шт. — ${(i.price * i.qty).toLocaleString('ru-RU')} ₽`
    ),
    '',
    cart.length ? `💰 <b>Итого:</b> ${total.toLocaleString('ru-RU')} ₽` : null,
    '',
    `⏱ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`,
  ];
  return lines.filter(l => l !== null).join('\n');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setOrderStatus(type, msg) {
  const el = document.getElementById('order-form-status');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'order-form__status' + (type ? ` order-form__status--${type}` : '');
}

/* ── Инициализация ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Кнопка «ОФОРМИТЬ» в корзине */
  document.getElementById('cart-checkout')?.addEventListener('click', e => {
    e.preventDefault();
    closeCart();
    openOrderModal();
  });

  /* Кнопка «Связаться» в хедере (десктоп + мобайл) */
  document.querySelectorAll('[href="#contacts"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openOrderModal();
    });
  });

  /* Закрытие */
  document.getElementById('order-modal-close')?.addEventListener('click', closeOrderModal);
  document.getElementById('order-modal-backdrop')?.addEventListener('click', closeOrderModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOrderModal(); });

  /* Отправка формы */
  document.getElementById('order-form')?.addEventListener('submit', async e => {
    e.preventDefault();

    const name     = document.getElementById('order-name').value.trim();
    const phone    = document.getElementById('order-phone').value.trim();
    const telegram = document.getElementById('order-tg').value.trim();
    const cart     = getCart();
    const total    = getTotal();

    if (!name || !phone) {
      setOrderStatus('error', '⚠ Заполните Имя и Номер телефона');
      return;
    }

    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Отправка...';
    setOrderStatus('', '');

    try {
      const res = await fetch('/api/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, telegram, cart, total }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setOrderStatus('success', '✓ Заявка принята! Свяжемся в ближайшее время.');
      saveCart([]);
      setTimeout(closeOrderModal, 2500);

    } catch (err) {
      console.error('[Order]', err);
      setOrderStatus('error', '✗ Ошибка отправки. Напишите в Telegram: @peptidelabs');

    } finally {
      btn.disabled    = false;
      btn.textContent = 'Отправить заказ';
    }
  });
});
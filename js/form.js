'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form   = document.getElementById('offer-form');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name    = form.elements.name.value.trim();
    const contact = form.elements.contact.value.trim();

    if (!name || !contact) {
      setStatus('error', '⚠ Заполните обязательные поля: Имя и Контакт');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Отправка...';
    setStatus('', '');

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          company: form.elements.company.value.trim(),
          contact,
          details: form.elements.details.value.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setStatus('success', '✓ Заявка отправлена — свяжемся в течение 2 часов');
      form.reset();

    } catch (err) {
      console.error('[Form]', err);
      setStatus('error', '✗ Ошибка отправки. Напишите напрямую: @peptidelabs');

    } finally {
      btn.disabled    = false;
      btn.textContent = 'Отправить заявку';
    }
  });

  function setStatus(type, msg) {
    if (!status) return;
    status.textContent = msg;
    status.className   = 'form__status' + (type ? ` form__status--${type}` : '');
  }
});
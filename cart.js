'use strict';

const CART_KEY = 'peptide_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart({ id, name, img, dosage, price, qty = 1 }) {
  const cart     = getCart();
  const existing = cart.find(i => i.id === id && i.dosage === dosage);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, name, img, dosage, price, qty });
  }
  saveCart(cart);
  renderCart();
  openCart();
}

function removeFromCart(id, dosage) {
  saveCart(getCart().filter(i => !(i.id === id && i.dosage === dosage)));
  renderCart();
}

function changeQty(id, dosage, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id && i.dosage === dosage);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) { removeFromCart(id, dosage); return; }
  saveCart(cart);
  renderCart();
}

function getTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  badge.textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

function renderCart() {
  const body    = document.getElementById('cart-body');
  const totalEl = document.getElementById('cart-total');
  if (!body) return;

  const cart = getCart();

  if (!cart.length) {
    body.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
    if (totalEl) totalEl.textContent = '0';
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}" data-dosage="${item.dosage}">
      <img
        src="${item.img}"
        alt="${item.name}"
        class="cart-item__img"
        onerror="this.style.visibility='hidden'"
      >
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__dosage">${item.dosage}</p>
        <div class="cart-item__row">
          <div class="cart-item__counter">
            <button class="cart-item__minus" type="button">−</button>
            <span class="cart-item__qty">${item.qty}</span>
            <button class="cart-item__plus"  type="button">+</button>
          </div>
          <span class="cart-item__price">
            ${(item.price * item.qty).toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>
      <button class="cart-item__remove" type="button" aria-label="Удалить">×</button>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = getTotal().toLocaleString('ru-RU');

  body.querySelectorAll('.cart-item').forEach(el => {
    const { id, dosage } = el.dataset;
    el.querySelector('.cart-item__remove').addEventListener('click', () => removeFromCart(id, dosage));
    el.querySelector('.cart-item__minus').addEventListener('click',  () => changeQty(id, dosage, -1));
    el.querySelector('.cart-item__plus').addEventListener('click',   () => changeQty(id, dosage, +1));
  });
}

function openCart() {
  renderCart();   
  document.getElementById('cart-panel')?.classList.add('is-open');
  document.getElementById('cart-overlay')?.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-panel')?.classList.remove('is-open');
  document.getElementById('cart-overlay')?.classList.remove('is-visible');
  document.body.style.overflow = '';
}

/* Кнопка «ДОБАВИТЬ В КОРЗИНУ» — делегирование */
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn--submit');
  if (!btn) return;

  const dosageInput = document.querySelector('input[name="dosage"]:checked');
  const price       = parseInt(dosageInput?.dataset.price, 10);
  const dosage      = dosageInput?.value;
  const qty         = parseInt(document.getElementById('qtyInput')?.value, 10) || 1;

  if (!dosage || isNaN(price) || price <= 0) return;

  addToCart({
    id:   btn.dataset.id,
    name: btn.dataset.name,
    img:  btn.dataset.img,
    dosage,
    price,
    qty,
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.header__cart-btn')?.addEventListener('click', openCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
  
  updateCartBadge();
  renderCart(); 
});

document.querySelectorAll('.faq__card').forEach((card) => {
  card.addEventListener('click', () => {
    card.classList.toggle('is-open');
  });
});
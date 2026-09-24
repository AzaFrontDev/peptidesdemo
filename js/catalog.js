'use strict';

let allProducts = []; // ← глобальный массив для frequentlyBoughtTogether

/* ── Загрузка и поиск товара по id из URL ────────────── */
async function loadProduct(productId) {
  try {
    const id = productId ?? new URLSearchParams(window.location.search).get('id');

    const res  = await fetch('js/catalog.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allProducts = data;

    const item = id ? data.find(p => p.id === id) : null;

    if (!item) {
      const root = document.getElementById('product-root');
      if (root) root.innerHTML = `
        <p style="padding:60px;font-size:24px;text-align:center;">
          Товар не найден
        </p>`;
      return;
    }

    renderHero(item);

  } catch (err) {
    console.error('[Product] Ошибка загрузки:', err);
  }
}

function showProductView(id) {
  const catalogSection = document.getElementById('catalog-section');
  const productSection = document.getElementById('product-section');

  if (!catalogSection) { console.error('[Nav] Нет элемента #catalog-section'); return; }
  if (!productSection) { console.error('[Nav] Нет элемента #product-section'); return; }

  catalogSection.style.display = 'none';
  productSection.style.display = 'block';
  window.scrollTo(0, 0);
  history.pushState({ id }, '', `catalog.html?id=${id}`);
  loadProduct(id);
}

function showCatalogView() {
  document.getElementById('product-section').style.display = 'none';
  document.getElementById('catalog-section').style.display = 'block';
  window.scrollTo(0, 0);
}

/* ── Рендер страницы товара ──────────────────────────── */
function renderHero(item) {
  const root = document.getElementById('product-root');
  if (!root) return;

  const firstPrice  = item.dosages[0]?.price ?? null;
  const validThumbs = item.images.thumbs.filter(t => t.src);

  root.innerHTML = `
    <!-- Левая колонка: Галерея -->
    <div class="product-gallery">
      <div class="product-gallery__main">
        <button class="gallery-arrow gallery-arrow--prev" type="button" aria-label="Назад">
          <img src="src/hero/arrow-prev-image.webp" class="arrow-prev" alt="Назад">
        </button>
        <img
          src="${item.images.main}"
          alt="${item.name}"
          id="mainImg"
          class="product-gallery__image"
          onerror="this.style.visibility='hidden'"
        >
        <button class="gallery-arrow gallery-arrow--next" type="button" aria-label="Вперед">
          <img src="src/hero/arrow-next-image.webp" class="arrow-next" alt="Вперёд">
        </button>
      </div>

      <div class="product-gallery__thumbs">
        ${validThumbs.map((thumb, idx) => `
          <button
            class="thumb-card ${idx === 0 ? 'is-active' : ''}"
            type="button"
            data-src="${thumb.src}"
            data-idx="${idx}"
          >
            <div class="thumb-card__preview">
              <img src="${thumb.src}" alt="${thumb.label || item.name}">
            </div>
            ${thumb.label ? `<span class="thumb-card__label">${thumb.label}</span>` : ''}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Правая колонка: Конфигуратор -->
    <div class="product-order">
      <a href="index.html" class="product-order__breadcrumb">Каталог</a>

      <div class="product-order__badges">
        ${item.badges.map(b => `<span class="badge badge--${b}">${b}</span>`).join('')}
      </div>

      <h1 class="product-order__title">${item.name}</h1>
      <p class="product-order__desc">${item.subtitle}</p>

      <div class="product-order__rating">
        <span class="stars">★★★★★</span>
        <span class="score">${item.rating}</span>
        <span class="dot">·</span>
        <span class="reviews">${item.reviewsCount} отзыва</span>
      </div>

      <div class="product-order__group">
        <span class="product-order__label">Форма выпуска</span>
        <div class="form-selector">
          ${item.forms.map((form, idx) => `
            <label class="form-option">
              <input type="radio" name="form_type" value="${form.type}" ${idx === 0 ? 'checked' : ''}>
              <div class="form-option__content">
                <img src="${form.img}" alt="${form.label}">
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="product-order__group">
        <span class="product-order__label">Дозировка</span>
        <div class="dosage-selector">
          ${item.dosages.map((d, idx) => `
            <label class="dosage-chip">
              <input type="radio" name="dosage" value="${d.value}" data-price="${d.price ?? ''}" ${idx === 0 ? 'checked' : ''}>
              <span class="dosage-chip__box">${d.value}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="product-order__purchase-row">
        <div class="product-order__field">
          <span class="product-order__label">Количество</span>
          <div class="counter">
            <button class="counter__btn" id="minusBtn" type="button">−</button>
            <input class="counter__input" id="qtyInput" type="number" value="1" min="1" readonly>
            <button class="counter__btn" id="plusBtn" type="button">+</button>
          </div>
        </div>

        <div class="product-order__field">
          <span class="product-order__label">Цена</span>
          <div class="product-price">
            <span id="priceValue">
              ${firstPrice !== null ? firstPrice.toLocaleString('ru-RU') : '—'}
            </span> ₽
          </div>
        </div>

        <div class="product-order__discounts">                                                                                                                                          
          <span>от 5 шт. — скидка 10%</span>
          <span>от 10 шт. — скидка 15%</span>
        </div>
      </div>

      <button class="btn btn--submit" type="button"
  data-id="${item.id}"
  data-name="${item.name}"
  data-img="${item.images.main}"
>ДОБАВИТЬ В КОРЗИНУ</button>

      <div class="product-order__actions">
        <a href="#calc" class="action-link">Рассчитать дозировку →</a>
        <a href="#coa" class="action-link">Запросить COA →</a>
        <a href="#faq" class="action-link">Задать вопрос →</a>
      </div>
    </div>
  `;

  initInteractions(item, validThumbs);
  renderTabs(item);
}

/* ── Интерактив: галерея + счётчик + цена ────────────── */
function initInteractions(item, validThumbs) {
  const mainImg = document.getElementById('mainImg');
  const thumbs  = document.querySelectorAll('.thumb-card');
  const prevBtn = document.querySelector('.gallery-arrow--prev');
  const nextBtn = document.querySelector('.gallery-arrow--next');
  let activeIdx = 0;

  function setThumb(idx) {
    activeIdx = idx;
    thumbs.forEach(t => t.classList.remove('is-active'));
    thumbs[idx]?.classList.add('is-active');
    const src = validThumbs[idx]?.src;
    if (mainImg && src) {
      mainImg.src              = src;
      mainImg.style.visibility = 'visible';
    }
  }

  thumbs.forEach((btn, idx) => btn.addEventListener('click', () => setThumb(idx)));
  prevBtn?.addEventListener('click', () => setThumb((activeIdx - 1 + thumbs.length) % thumbs.length));
  nextBtn?.addEventListener('click', () => setThumb((activeIdx + 1) % thumbs.length));

  const minus   = document.getElementById('minusBtn');
  const plus    = document.getElementById('plusBtn');
  const input   = document.getElementById('qtyInput');
  const priceEl = document.getElementById('priceValue');

  if (!minus || !plus || !input || !priceEl) return;

  function updatePricing() {
    const radio    = document.querySelector('input[name="dosage"]:checked');
    const rawPrice = parseInt(radio?.dataset.price, 10);
    if (!radio || isNaN(rawPrice)) { priceEl.textContent = '—'; return; }

    const count    = parseInt(input.value, 10);
    let finalPrice = rawPrice * count;
    if (count >= 10)     finalPrice = Math.round(finalPrice * 0.85);
    else if (count >= 5) finalPrice = Math.round(finalPrice * 0.90);
    priceEl.textContent = finalPrice.toLocaleString('ru-RU');
  }

  plus.addEventListener('click', () => { input.value = parseInt(input.value, 10) + 1; updatePricing(); });
  minus.addEventListener('click', () => {
    if (parseInt(input.value, 10) > 1) { input.value = parseInt(input.value, 10) - 1; updatePricing(); }
  });
  document.querySelectorAll('input[name="dosage"]').forEach(r => r.addEventListener('change', updatePricing));
}

/* ── Точка входа для табов ───────────────────────────── */
function renderTabs(item) {
  const reviewsCount = document.getElementById('reviews-count');
  if (reviewsCount) reviewsCount.textContent = item.reviewsCount;

  renderDescription(item);
  renderResearch(item);
  renderProtocol(item);
  renderStorage(item);
  renderFrequentlyBought(item); // ← новое
  initTabs();
}

/* ── Описание ────────────────────────────────────────── */
function renderDescription(item) {
  const panel = document.getElementById('tab-description');
  if (!panel) return;

  const solvent = item.synergy?.find(s => s.id === 'bac-water');

  panel.innerHTML = `
    <h2 class="tab-panel__title">Описание</h2>
    <p class="tab-panel__text">${item.pharmacology.mechanism}</p>
    <div class="specs-grid">
      <div class="specs-card">
        <h4 class="specs-card__title">Характеристики</h4>
        <dl class="specs-list">
          <div class="specs-row"><dt>Формула</dt><dd>${item.specifications.formula}</dd></div>
          <div class="specs-row"><dt>Мол. масса</dt><dd>${item.specifications.molecularWeight}</dd></div>
          <div class="specs-row"><dt>Последовательность</dt><dd class="specs-row__sequence">${item.specifications.sequence}</dd></div>
          <div class="specs-row"><dt>Вид</dt><dd>${item.forms[0]?.label ?? '—'}</dd></div>
          ${solvent ? `<div class="specs-row"><dt>Растворимость</dt><dd>${solvent.name}</dd></div>` : ''}
        </dl>
      </div>
      <div class="specs-card">
        <h4 class="specs-card__title">Области исследований</h4>
        <ul class="research-areas">
          ${item.research.areas.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

/* ── Исследования ────────────────────────────────────── */
function renderResearch(item) {
  const panel = document.getElementById('tab-research');
  if (!panel) return;

  const { areas, keyStudies } = item.research;
  const { comparison }        = item.pharmacology;

  panel.innerHTML = `
    <h2 class="tab-panel__title">Исследования</h2>
    <ul class="research-areas-list">
      ${areas.map(a => `<li class="research-area-item">${a}</li>`).join('')}
    </ul>
    ${keyStudies ? `
      <div class="key-study-card">
        <h4 class="key-study-card__title">Ключевые исследования</h4>
        <p class="key-study-card__text">${keyStudies}</p>
      </div>` : ''}
    ${comparison ? `
      <div class="comparison-card">
        <h4 class="comparison-card__title">vs ${comparison.target}</h4>
        <p class="comparison-card__text">${comparison.text}</p>
      </div>` : ''}
  `;
}

/* ── Протокол ────────────────────────────────────────── */
function renderProtocol(item) {
  const panel = document.getElementById('tab-protocol');
  if (!panel) return;

  panel.innerHTML = `
    <h2 class="tab-panel__title">Протокол</h2>
    ${item.synergy?.length ? `
      <div class="protocol-section">
        <h4 class="protocol-section__title">Синергия с другими пептидами</h4>
        <ul class="synergy-list">
          ${item.synergy.map(s => `
            <li class="synergy-item">
              <a href="catalog.html?id=${s.id}" class="synergy-item__name">${s.name}</a>
              ${s.note ? `<span class="synergy-item__note">${s.note}</span>` : ''}
            </li>`).join('')}
        </ul>
      </div>` : '<p>Нет данных</p>'}
  `;
}

/* ── Хранение ────────────────────────────────────────── */
function renderStorage(item) {
  const panel = document.getElementById('tab-storage');
  if (!panel) return;

  const { lyophilizate, solution } = item.storage;

  panel.innerHTML = `
    <h2 class="tab-panel__title">Хранение</h2>
    <dl class="storage-list">
      ${lyophilizate ? `<div class="storage-row"><dt>Лиофилизат (порошок)</dt><dd>${lyophilizate}</dd></div>` : ''}
      ${solution     ? `<div class="storage-row"><dt>Раствор (после разведения)</dt><dd>${solution}</dd></div>` : ''}
    </dl>
  `;
}

/* ── Часто покупают вместе ───────────────────────────── */
function renderFrequentlyBought(item) {
  const container = document.getElementById('frequently-bought');
  if (!container) return;

  const related = item.frequentlyBoughtTogether
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean);

  if (!related.length) { container.style.display = 'none'; return; }

  container.innerHTML = `
    <h2 class="frequently-bought__title">Часто покупают вместе</h2>
    <div class="frequently-bought__grid">
      ${related.map(p => {
        const badge  = p.badges?.[0] ?? null;
        const price  = p.dosages.find(d => d.price !== null)?.price ?? 0;
        const spec   = p.dosages[0]?.value ?? '';
        const fLabel = p.forms?.[0]?.label ?? '';
        return `
          <article class="product-card">
            <img src="${p.images.main}" alt="${p.name}" class="product-card__img" onerror="this.style.visibility='hidden'">
            <h4 class="product-card__title">${p.name}</h4>
            <p class="product-card__desc">${p.categoryLabel}</p>
            <p class="product-card__spec">${fLabel} · ${spec}</p>
            <span class="product-card__price">${price} ₽</span>
            <a href="catalog.html?id=${p.id}" class="product-card__btn">КУПИТЬ</a>
          </article>`;
      }).join('')}
    </div>
  `;
}

/* ── Переключение табов ──────────────────────────────── */
function initTabs() {
  const tabs   = document.querySelectorAll('.product-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(t   => t.classList.remove('product-tab--active'));
  panels.forEach(p => p.classList.remove('tab-panel--active'));
  tabs[0]?.classList.add('product-tab--active');
  panels[0]?.classList.add('tab-panel--active');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t   => t.classList.remove('product-tab--active'));
      panels.forEach(p => p.classList.remove('tab-panel--active'));
      tab.classList.add('product-tab--active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('tab-panel--active');
    });
  });
}

/* ── Кнопка «Назад» в браузере ──────────────────────── */
window.addEventListener('popstate', () => {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) {
    showProductView(id);
  } else {
    showCatalogView();
  }
});

/* ── Старт ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) showProductView(id);
});
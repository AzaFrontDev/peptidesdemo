  'use strict';

  /* ── Инициализация каталога ──────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {

    const GRID_SEL  = '.peptides__catalog-grid';
    const TAB_SEL   = '.peptides__tab-btn';
    const MORE_SEL  = '.peptides__btn-more';
    const LIMIT     = 8;

    const TAB_MAP = {
      'Все':            'all',
      'Похудение':      ['weight-loss', 'fat-loss'],
      'Восстановление': ['recovery'],
      'Нейро и сон':    ['nootropics'],
      'Антиэйдж':       ['longevity', 'immunity'],
      'Красота':        ['cosmetology', 'libido'],
      'Спреи':          'spray',
      'Бленды':         'blend',
    };

    let products     = [];
    let activeFilter = 'all';
    let expanded     = false;

    function applyFilter(filter) {
      if (filter === 'all')   return products;
      if (filter === 'spray') return products.filter(p => p.forms.some(f => f.type === 'spray'));
      if (filter === 'blend') return products.filter(p =>
        p.id.includes('blend') || p.forms.some(f => f.type === 'blend'));
      if (Array.isArray(filter)) return products.filter(p => filter.includes(p.category));
      return products;
    }

    function getPrice(p) {
      const hit = p.dosages.find(d => d.price !== null);
      return hit ? hit.price : 0;
    }

    function cardHTML(p) {
      const badge     = p.badges?.[0] ?? null;
      const formLabel = p.forms?.[0]?.label ?? '';
      const price     = getPrice(p);
      return `
        <article class="product-card">
          ${badge ? `<span class="product-card__badge">${badge.toUpperCase()}</span>` : ''}
          <img src="${p.images.main}" alt="${p.name}" class="product-card__img" onerror="this.style.visibility='hidden'"/>
          <h4 class="product-card__title">${p.name}</h4>
          <p class="product-card__desc">${p.categoryLabel}</p>
          <p class="product-card__spec">${formLabel}</p>
          <span class="product-card__price">${price} ₽</span>
          <a href="catalog.html?id=${p.id}" class="product-card__btn">ПОДРОБНЕЕ</a>
        </article>`;
    }

    function render() {
      const grid    = document.querySelector(GRID_SEL);
      const btnMore = document.querySelector(MORE_SEL);
      if (!grid) return;

      const filtered = applyFilter(activeFilter);
      const visible  = expanded ? filtered : filtered.slice(0, LIMIT);
      grid.innerHTML = visible.map(cardHTML).join('');

      if (btnMore) {
        const hidden = filtered.length - visible.length;
        if (hidden > 0) {
          btnMore.style.display = '';
          btnMore.textContent   = `ВСЕ ТОВАРЫ (${filtered.length}+)`;
        } else {
          btnMore.style.display = 'none';
        }
      }
    }

    document.querySelectorAll(TAB_SEL).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(TAB_SEL)
          .forEach(t => t.classList.remove('peptides__tab-btn--active'));
        btn.classList.add('peptides__tab-btn--active');
        activeFilter = TAB_MAP[btn.textContent.trim()] ?? 'all';
        expanded     = false;
        render();
      });
    });

    const btnMore = document.querySelector(MORE_SEL);
    if (btnMore) {
      btnMore.addEventListener('click', e => {
        e.preventDefault();
        expanded = true;
        render();
      });
    }

    fetch('catalog.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { products = data; render(); })
      .catch(err => console.error('[Catalog] Не удалось загрузить catalog.json:', err));
  });

  /* ── Перехват кликов по карточкам (отдельно от DOMContentLoaded) ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.product-card__btn');
    if (!btn) return;

    // Если showProductView есть — мы на catalog.html, перехватываем
    if (typeof showProductView === 'function') {
      e.preventDefault();
      const url = new URL(btn.href);
      const id  = url.searchParams.get('id');
      if (id) showProductView(id);
    }
  });
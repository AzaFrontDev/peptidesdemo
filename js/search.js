'use strict';

let searchData = [];

async function loadSearchData() {
  if (searchData.length) return;
  try {
    const res  = await fetch('./catalog.json');
    searchData = await res.json();
  } catch (e) {
    console.error('[Search]', e);
  }
}

function filterProducts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return searchData.filter(p =>
    p.name.toLowerCase().includes(q)         ||
    p.nameRu?.toLowerCase().includes(q)      ||
    p.id.toLowerCase().includes(q)           ||
    p.categoryLabel?.toLowerCase().includes(q)
  ).slice(0, 8);
}

function renderResults(results, query) {
  const list = document.getElementById('search-results');
  if (!list) return;

  if (!query.trim()) { list.innerHTML = ''; return; }

  if (!results.length) {
    list.innerHTML = '<li class="search-result--empty">Ничего не найдено</li>';
    return;
  }

  list.innerHTML = results.map(p => `
    <li class="search-result">
      <a class="search-result__link" href="catalog.html?id=${p.id}" data-id="${p.id}">
        <img
          src="${p.images.main}"
          alt="${p.name}"
          class="search-result__img"
          onerror="this.style.visibility='hidden'"
        >
        <div class="search-result__info">
          <p class="search-result__name">${p.name}</p>
          <p class="search-result__cat">${p.categoryLabel}</p>
        </div>
      </a>
    </li>
  `).join('');

  list.querySelectorAll('.search-result__link').forEach(a => {
    a.addEventListener('click', e => {
      if (typeof showProductView === 'function') {
        e.preventDefault();
        closeSearch();
        showProductView(a.dataset.id);
      }
    });
  });
}

function openSearch() {
  document.getElementById('search-modal')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  loadSearchData();
  setTimeout(() => document.getElementById('search-input')?.focus(), 50);
}

function closeSearch() {
  document.getElementById('search-modal')?.classList.remove('is-open');
  document.body.style.overflow = '';
  const input = document.getElementById('search-input');
  const list  = document.getElementById('search-results');
  if (input) input.value = '';
  if (list)  list.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
  /* Иконка поиска в хедере */
  document.querySelector('[aria-label="Поиск по сайту"]')?.addEventListener('click', openSearch);

  /* Кнопка «Поиск по пептидам» (десктоп + мобайл) */
  document.querySelectorAll('[href="#search-peptides"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openSearch();
    });
  });

  document.getElementById('search-close')?.addEventListener('click', closeSearch);

  document.getElementById('search-modal')?.addEventListener('click', e => {
    if (e.target.id === 'search-modal') closeSearch();
  });

  document.getElementById('search-input')?.addEventListener('input', e => {
    renderResults(filterProducts(e.target.value), e.target.value);
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
});
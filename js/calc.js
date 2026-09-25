'use strict';

/* ── Данные ──────────────────────────────────────────── */
const CALC_PEPTIDES = [
  { id: 'bpc-157',     name: 'BPC-157',        dosages: [5, 10],       water: {5:2,10:2},                  dose: 250,  unit: 'мкг', mul: 1    },
  { id: 'tb-500',      name: 'TB-500',         dosages: [5, 10],       water: {5:2,10:2},                  dose: 750,  unit: 'мкг', mul: 1    },
  { id: 'bpc-tb',      name: 'BPC-157 + TB-500', dosages: [10],        water: {10:2},                      dose: 500,  unit: 'мкг', mul: 1    },
  { id: 'tirzepatide', name: 'Tirzepatide',    dosages: [5, 10, 15],   water: {5:1,10:2,15:3},             dose: 2.5,  unit: 'мг',  mul: 1000 },
  { id: 'retatrutide', name: 'Retatrutide',    dosages: [5, 10],       water: {5:1,10:2},                  dose: 2,    unit: 'мг',  mul: 1000 },
  { id: 'semaglutide', name: 'Semaglutide',    dosages: [5],           water: {5:1},                       dose: 0.5,  unit: 'мг',  mul: 1000 },
  { id: 'semax',       name: 'Semax',          dosages: [5],           water: {5:2},                       dose: 500,  unit: 'мкг', mul: 1    },
  { id: 'selank',      name: 'Selank',         dosages: [5],           water: {5:2},                       dose: 250,  unit: 'мкг', mul: 1    },
  { id: 'dsip',        name: 'DSIP',           dosages: [5],           water: {5:2},                       dose: 100,  unit: 'мкг', mul: 1    },
  { id: 'pt-141',      name: 'PT-141',         dosages: [10],          water: {10:2},                      dose: 2,    unit: 'мг',  mul: 1000 },
  { id: 'epithalon',   name: 'Epithalon',      dosages: [10],          water: {10:2},                      dose: 1,    unit: 'мг',  mul: 1000 },
  { id: 'ghk-cu',      name: 'GHK-Cu',         dosages: [50],          water: {50:2},                      dose: 5,    unit: 'мг',  mul: 1000 },
  { id: 'glutathione', name: 'Glutathione',    dosages: [1500],        water: {1500:3},                    dose: 200,  unit: 'мг',  mul: 1000 },
  { id: 'cjc-1295',    name: 'CJC-1295 + IPA', dosages: [10],          water: {10:2},                      dose: 300,  unit: 'мкг', mul: 1    },
];

const WATER_OPTIONS = [1, 2, 3, 10];
const SYRINGE_CAPACITY = { 0.3: 30, 0.5: 50, 1: 100 }; // units U-100

/* ── Текущие выбранные значения ──────────────────────── */
let state = {
  peptide:  null,
  dosage:   null,
  water:    null,
  dose:     null,
  syringe:  0.3,
};

/* ── Утилиты для чипов ───────────────────────────────── */
function renderChips(containerId, values, labelFn, activeValue) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = values.map(v => `
    <button class="calc-chip${v === activeValue ? ' is-active' : ''}"
            data-value="${v}" type="button">
      ${labelFn(v)}
    </button>
  `).join('');
}

function getActiveChip(containerId) {
  const active = document.querySelector(`#${containerId} .calc-chip.is-active`);
  return active ? parseFloat(active.dataset.value) : null;
}

/* ── Обработчики ─────────────────────────────────────── */
function onPeptideChange() {
  const id = document.getElementById('calc-peptide').value;
  state.peptide = CALC_PEPTIDES.find(p => p.id === id) || null;
  state.dosage  = null;
  state.water   = null;

  const grid = document.getElementById('calc-grid');

  if (!state.peptide) {
    grid.hidden = true;
    document.getElementById('calc-results').hidden = true;
    return;
  }

  grid.hidden = false;
  const p = state.peptide;

  /* Дозировки */
  state.dosage = p.dosages[0];
  renderChips('calc-dosage-chips', p.dosages, v => `${v} мг`, state.dosage);

  /* Вода — рекомендуемая */
  state.water = p.water[state.dosage] ?? 2;
  renderChips('calc-water-chips', WATER_OPTIONS, v => `${v} мл`, state.water);

  /* Доза */
  document.getElementById('calc-dose').value = p.dose;
  document.getElementById('calc-dose-unit').textContent = p.unit;
  state.dose = p.dose;

  bindChipListeners();
  recalculate();
}

function onDosageChipClick(value) {
  state.dosage = value;
  activateChip('calc-dosage-chips', value);

  /* Обновляем рекомендуемую воду */
  if (state.peptide) {
    state.water = state.peptide.water[value] ?? state.water;
    activateChip('calc-water-chips', state.water);
  }
  recalculate();
}

function onWaterChipClick(value) {
  state.water = value;
  activateChip('calc-water-chips', value);
  recalculate();
}

function onSyringeClick(btn) {
  document.querySelectorAll('.calc-syringe-card').forEach(c => c.classList.remove('is-active'));
  btn.classList.add('is-active');
  state.syringe = parseFloat(btn.dataset.ml);
  recalculate();
}

function activateChip(containerId, value) {
  document.querySelectorAll(`#${containerId} .calc-chip`).forEach(c => {
    c.classList.toggle('is-active', parseFloat(c.dataset.value) === value);
  });
}

function bindChipListeners() {
  document.querySelectorAll('#calc-dosage-chips .calc-chip').forEach(c => {
    c.addEventListener('click', () => onDosageChipClick(parseFloat(c.dataset.value)));
  });
  document.querySelectorAll('#calc-water-chips .calc-chip').forEach(c => {
    c.addEventListener('click', () => onWaterChipClick(parseFloat(c.dataset.value)));
  });
}

/* ── Реактивный пересчёт ─────────────────────────────── */
function recalculate() {
  const res = document.getElementById('calc-results');
  const doseInput = parseFloat(document.getElementById('calc-dose').value);
  state.dose = doseInput;

  if (!state.peptide || !state.dosage || !state.water || !state.dose) {
    res.hidden = true;
    return;
  }

  const p        = state.peptide;
  const vialMcg  = state.dosage * 1000;
  const doseMcg  = state.dose * p.mul;
  const concn    = vialMcg / state.water;       // мкг/мл
  const volume   = doseMcg / concn;              // мл
  const divs     = Math.round(volume * 100);     // делений U-100
  const shots    = Math.floor(vialMcg / doseMcg);
  const capacity = SYRINGE_CAPACITY[state.syringe];

  /* Результат — объём */
  document.getElementById('calc-result-volume').innerHTML =
    `Набирайте <strong>${volume.toFixed(2)} мл</strong> — это <strong>${divs} делений</strong> на инсулиновом шприце U-100`;

  /* Результат — инъекции */
  document.getElementById('calc-result-injections').innerHTML =
    `Одного флакона хватит на <strong>${shots} инъекций</strong>`;

  /* Предупреждение — не влезает в шприц */
  const warn = document.getElementById('calc-result-warn');
  if (divs > capacity) {
    warn.textContent = `⚠ Объём ${volume.toFixed(2)} мл не влезет в шприц ${state.syringe} мл (макс. ${capacity} делений). Выберите шприц побольше.`;
    warn.hidden = false;
  } else {
    warn.hidden = true;
  }

  /* Кнопка купить */
  const buyBtn = document.getElementById('calc-result-buy');
  buyBtn.textContent = `Купить ${p.name} →`;
  if (typeof showProductView === 'function') {
    buyBtn.onclick = e => { e.preventDefault(); closeCalcModal(); showProductView(p.id); };
    buyBtn.href = '#';
  } else {
    buyBtn.onclick = null;
    buyBtn.href = `catalog.html?id=${p.id}`;
  }

  res.hidden = false;
}

/* ── Открытие / Закрытие ─────────────────────────────── */
function openCalcModal() {
  document.getElementById('calc-modal')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCalcModal() {
  document.getElementById('calc-modal')?.classList.remove('is-open');
  document.body.style.overflow = '';
  document.getElementById('calc-peptide').value = '';
  document.getElementById('calc-grid').hidden = true;
  document.getElementById('calc-results').hidden = true;
  state = { peptide: null, dosage: null, water: null, dose: null, syringe: 0.3 };
  document.querySelectorAll('.calc-syringe-card').forEach((c, i) => {
    c.classList.toggle('is-active', i === 0);
  });
}

/* ── Старт ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Заполняем дропдаун */
  const sel = document.getElementById('calc-peptide');
  if (sel) {
    CALC_PEPTIDES.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  }

  /* Слушатели */
  document.getElementById('calc-peptide')?.addEventListener('change', onPeptideChange);

  document.querySelectorAll('.calc-syringe-card').forEach(c => {
    c.addEventListener('click', () => onSyringeClick(c));
  });

  document.getElementById('calc-dose')?.addEventListener('input', recalculate);

  /* Открытие */
  document.querySelectorAll('.calc__btn, [href="#calculator"]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openCalcModal(); });
  });

  /* Закрытие */
  document.getElementById('calc-modal-close')?.addEventListener('click', closeCalcModal);
  document.getElementById('calc-modal-backdrop')?.addEventListener('click', closeCalcModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCalcModal(); });
});
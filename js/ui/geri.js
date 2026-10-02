// Bildirim (toast), onay kutusu ve alttan açılan panel.
'use strict';
import { el } from './bilesen.js';

const katman = () => document.getElementById('katman');
const kutu = () => document.getElementById('bildirimKutu');

let bildirimZaman = null;

/** Alt kısımda kısa mesaj. Eylem verilirse tıklanabilir düğme çıkar. */
export function bildir(mesaj, { eylemAd, eylem, sure = 6000 } = {}) {
  const k = kutu();
  k.textContent = '';
  const mesajDugmesi = el('div', { class: 'bildirim' },
    el('span', { class: 'bildirim__mesaj', text: mesaj }),
  );
  if (eylem) {
    mesajDugmesi.appendChild(el('button', {
      class: 'bildirim__eylem', type: 'button',
      onclick: () => { k.textContent = ''; eylem(); },
    }, eylemAd || 'Geri Al'));
  }
  k.appendChild(mesajDugmesi);
  clearTimeout(bildirimZaman);
  bildirimZaman = setTimeout(() => { k.textContent = ''; }, sure);
}

/** Onay kutusu. Promise<boolean> döner. */
export function onaySor({ baslik, mesaj, onayAd = 'Evet, devam et', iptalAd = 'Vazgeç', tehlike = false }) {
  return new Promise((cozumle) => {
    const k = katman();
    let bitti = false;
    const kapat = (sonuc) => {
      if (bitti) return;
      bitti = true;
      document.removeEventListener('keydown', tusla);
      k.textContent = '';
      cozumle(sonuc);
    };
    const tusla = (e) => {
      if (e.key === 'Escape') kapat(false);
    };
    const onayli = el('button', {
      class: `dugme ${tehlike ? 'dugme--tehlike' : 'dugme--ana'} dugme--tam`, type: 'button',
      onclick: () => kapat(true),
    }, onayAd);
    const perde = el('div', { class: 'katman__perde', onclick: () => kapat(false) });
    const govde = el('div', { class: 'panel', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'panel__tutamac' }),
      el('div', { class: 'panel__ust' }, el('h2', { class: 'panel__baslik', text: baslik })),
      el('div', { class: 'panel__govde' },
        el('p', { class: 'metin-k', text: mesaj }),
      ),
      el('div', { class: 'panel__alt' },
        el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => kapat(false) }, iptalAd),
        onayli,
      ),
    );
    k.textContent = '';
    k.appendChild(perde);
    k.appendChild(govde);
    document.addEventListener('keydown', tusla);
    onayli.focus();
  });
}

/** Metni panoya yazar. Esc/iOS kısıtlarında alternatif yol kullanılır. */
export async function panoyaYaz(metin) {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch {
    const alan = document.createElement('textarea');
    alan.value = metin;
    alan.setAttribute('readonly', '');
    alan.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(alan);
    alan.select();
    alan.setSelectionRange(0, metin.length);
    let basarili = false;
    try { basarili = document.execCommand('copy'); } catch { basarili = false; }
    alan.remove();
    return basarili;
  }
}

/** Alttan açılan panel. {kapat, govde} döner. */
export function panelAc(baslik, icerikDugumu, { altDugmeler, onKapat } = {}) {
  const k = katman();
  const kapat = () => {
    document.removeEventListener('keydown', tusla);
    k.textContent = '';
    if (onKapat) onKapat();
  };
  const tusla = (e) => { if (e.key === 'Escape') kapat(); };
  const perde = el('div', { class: 'katman__perde', onclick: kapat });
  const govde = el('div', { class: 'panel__govde' }, icerikDugumu);
  const p = el('div', { class: 'panel', role: 'dialog', 'aria-modal': 'true' },
    el('div', { class: 'panel__tutamac', onclick: kapat }),
    el('div', { class: 'panel__ust' },
      el('h2', { class: 'panel__baslik', text: baslik }),
      el('button', { class: 'eylem-dugme', type: 'button', 'aria-label': 'Kapat', onclick: kapat }, '✕'),
    ),
    govde,
    altDugmeler ? el('div', { class: 'panel__alt' }, altDugmeler) : null,
  );
  k.textContent = '';
  k.appendChild(perde);
  k.appendChild(p);
  document.addEventListener('keydown', tusla);
  return { kapat, govde, dugme: p };
}
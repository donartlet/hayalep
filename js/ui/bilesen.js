// Küçük DOM yardımcıları. Kütüphane yok, sadece bunlar.
'use strict';

/** el('div', {class:'x'}, 'metin', cocuk) -> HTMLElement */
export function el(etiket, ozellik = {}, ...cocuk) {
  const dugum = document.createElement(etiket);
  for (const [anahtar, deger] of Object.entries(ozellik || {})) {
    if (deger === null || deger === undefined || deger === false) continue;
    if (anahtar === 'class') dugum.className = deger;
    else if (anahtar === 'text') dugum.textContent = deger;
    else if (anahtar === 'style' && typeof deger === 'object') Object.assign(dugum.style, deger);
    else if (anahtar === 'veri' && typeof deger === 'object') {
      for (const [k, v] of Object.entries(deger)) dugum.dataset[k] = v;
    } else if (anahtar.startsWith('on') && typeof deger === 'function') {
      dugum.addEventListener(anahtar.slice(2), deger);
    } else if (GECENLER.includes(anahtar)) {
      dugum[anahtar] = deger;
    } else {
      dugum.setAttribute(anahtar, deger === true ? '' : deger);
    }
  }
  ekle(dugum, cocuk);
  return dugum;
}

const GECENLER = ['value', 'checked', 'disabled', 'type', 'placeholder', 'rows', 'maxLength', 'min', 'max',
  'step', 'id', 'name', 'htmlFor', 'accept', 'autofocus', 'multiple', 'required', 'readOnly'];

export function ekle(ebeveyn, cocuk) {
  for (const c of cocuk.flat(6)) {
    if (c === null || c === undefined || c === false || c === '') continue;
    if (Array.isArray(c)) { ekle(ebeveyn, c); continue; }
    ebeveyn.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return ebeveyn;
}

export function temizle(dugum) {
  while (dugum.firstChild) dugum.removeChild(dugum.firstChild);
  return dugum;
}

export function parcalar(karakter) {
  const sonuc = [];
  for (const p of String(karakter).split('')) {
    const k = p
      .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
      .replace(/Ş/g, 's').replace(/ş/g, 's')
      .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
      .replace(/Ü/g, 'u').replace(/ü/g, 'u')
      .replace(/Ö/g, 'o').replace(/ö/g, 'o')
      .replace(/Ç/g, 'c').replace(/ç/g, 'c');
    sonuc.push(k);
  }
  return sonuc.join('');
}

/** 1234.5 -> "1.234,50 ₺" (Türkçe biçim) */
export function para(sayi, simge = '₺') {
  const n = Number(sayi) || 0;
  const yazi = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
    .format(n);
  return `${yazi} ${simge}`;
}

export function tarih(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function tarihSaat(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

export function kisaKim() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function bosDeger(alan) {
  if (alan.tip === 'sayi' || alan.tip === 'para' || alan.tip === 'puan') return alan.varsayilan ?? 0;
  if (alan.tip === 'onay') return alan.varsayilan ?? false;
  return alan.varsayilan ?? '';
}
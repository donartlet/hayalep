// Alt bölümler (malzeme, adım, öğrenilecek, zorluk, not, sözlük) için ortak form + liste bileşeni.
// Her bölümün alanları burada tanımlı; yeni bölüm eklemek için sadece buraya bir giriy eklemek yeterli.
'use strict';
import { el, para, tarih, kisaKim } from './bilesen.js';
import { ZORLUK_SEVIYELERI, OGRENME_SEVIYELERI, PARA_BIRIMI } from '../veri/sema.js';
import { panelAc } from './geri.js';

/** alan: { ad, etiket, tip, zorunlu, varsayilan, secenekler, genislik, ipucu, satir (liste gösterimi) } */
export const ALANLAR = {
  malzemeler: {
    ad: 'Malzeme',
    toplamGoster: true,
    alanlar: [
      { ad: 'ad', etiket: 'Malzeme adı', tip: 'metin', zorunlu: true, genislik: 'tam' },
      { ad: 'adet', etiket: 'Adet', tip: 'sayi', varsayilan: 1, genislik: 'kisa', ipucu: 'Ondalık yazabilirsin (0.5 kg)' },
      { ad: 'birimFiyat', etiket: `Birim fiyat (${PARA_BIRIMI})`, tip: 'para', genislik: 'orta' },
      { ad: 'not', etiket: 'Not (isteğe bağlı)', tip: 'metin', genislik: 'tam' },
      { ad: 'aldi', etiket: 'Aldım', tip: 'onay', genislik: 'tam' },
    ],
  },
  adimlar: {
    ad: 'Yapım adımı',
    alanlar: [
      { ad: 'baslik', etiket: 'Ne yapılacak?', tip: 'metin', zorunlu: true, genislik: 'tam' },
      { ad: 'aciklama', etiket: 'Açıklama', tip: 'uzunmetin', genislik: 'tam' },
      { ad: 'tamamlandi', etiket: 'Bu adım tamamlandı', tip: 'onay', genislik: 'tam' },
    ],
  },
  ogrenilecekler: {
    ad: 'Öğrenilecek konu',
    alanlar: [
      { ad: 'konu', etiket: 'Konu', tip: 'metin', zorunlu: true, genislik: 'tam' },
      { ad: 'seviye', etiket: 'Seviye', tip: 'secim', secenekler: OGRENME_SEVIYELERI, genislik: 'orta' },
      { ad: 'kaynak', etiket: 'Kaynak / bağlantı', tip: 'metin', genislik: 'tam', ipucu: 'Video, sayfa ya da kitap adı' },
      { ad: 'ogrenildi', etiket: 'Öğrendim', tip: 'onay', genislik: 'tam' },
    ],
  },
  zorluklar: {
    ad: 'Zorluk',
    alanlar: [
      { ad: 'sorun', etiket: 'Nerede zorlanıyorum?', tip: 'metin', zorunlu: true, genislik: 'tam' },
      { ad: 'seviye', etiket: 'Seviye', tip: 'secim', secenekler: ZORLUK_SEVIYELERI, genislik: 'orta' },
      { ad: 'cozum', etiket: 'Nasıl çözeceğim?', tip: 'uzunmetin', genislik: 'tam' },
      { ad: 'asildi', etiket: 'Bu zorluğu aştım', tip: 'onay', genislik: 'tam' },
    ],
  },
  notlar: {
    ad: 'Not',
    alanlar: [
      { ad: 'metin', etiket: 'Notun', tip: 'uzunmetin', zorunlu: true, genislik: 'tam' },
    ],
  },
  sozluk: {
    ad: 'Sözlük kaydı',
    alanlar: [
      { ad: 'terim', etiket: 'Terim', tip: 'metin', zorunlu: true, genislik: 'tam' },
      { ad: 'anlam', etiket: 'Anlamı', tip: 'uzunmetin', genislik: 'tam' },
      { ad: 'ornek', etiket: 'Örnek', tip: 'uzunmetin', genislik: 'tam' },
      { ad: 'benimNotum', etiket: 'Benim notum', tip: 'uzunmetin', genislik: 'tam', ipucu: 'Kendi cümlenle yaz: ne öğrendin?' },
      { ad: 'favori', etiket: 'Favoride göster', tip: 'onay', genislik: 'tam' },
    ],
  },
};

function alanDugumu(alan, deger) {
  const kap = el('div', { class: 'alan' });
  if (alan.tip !== 'onay') kap.appendChild(el('label', { class: 'alan__etiket', text: alan.etiket + (alan.zorunlu ? ' *' : '') }));

  let girdi;
  switch (alan.tip) {
    case 'uzunmetin':
      girdi = el('textarea', { class: 'metin-alani', rows: 3, value: deger ?? '' });
      break;
    case 'sayi':
      girdi = el('input', { class: 'girdi', type: 'number', inputmode: 'decimal', step: 'any', value: deger ?? '' });
      break;
    case 'para':
      girdi = el('input', { class: 'girdi', type: 'number', inputmode: 'decimal', step: 'any', min: '0', value: deger ?? '' });
      break;
    case 'tarih':
      girdi = el('input', { class: 'girdi', type: 'date', value: deger ?? '' });
      break;
    case 'secim':
      girdi = el('select', { class: 'secim' },
        el('option', { value: '' }, alan.secenekler.length ? 'Seç' : ''),
        alan.secenekler.map((s) => el('option', { value: s.kod, selected: deger === s.kod }, s.ad)));
      break;
    case 'onay':
      girdi = el('input', { type: 'checkbox', checked: !!deger });
      kap.appendChild(el('label', { class: 'onay' }, girdi, el('span', { text: alan.etiket })));
      break;
    default:
      girdi = el('input', { class: 'girdi', type: 'text', value: deger ?? '' });
  }
  if (alan.tip !== 'onay') kap.appendChild(girdi);
  if (alan.ipucu) kap.appendChild(el('span', { class: 'alan__ipucu', text: alan.ipucu }));
  return { kap, girdi };
}

/** Formu DOM olarak kurar. -> { dugum, deger, kaydet() } */
export function formDugumu(tur, mevcut = {}) {
  const sema = ALANLAR[tur];
  const durum = { ...mevcut };
  const form = el('form', { class: 'form', onsubmit: (e) => { e.preventDefault(); kaydet(); } });
  const kutu = el('div', { class: 'sira sira--iki' });
  const girdiler = [];

  for (const alan of sema.alanlar) {
    const { kap, girdi } = alanDugumu(alan, durum[alan.ad]);
    girdiler.push({ alan, girdi });
    kap.classList.add('sira__hucre');
    if (alan.genislik === 'tam') kap.style.gridColumn = '1 / -1';
    kutu.appendChild(kap);
  }

  function deger() {
    // Bilinmeyen alanlar (ör. araştırmadan gelen kaynak) korunur
    const sonuc = { ...durum, id: durum.id || kisaKim() };
    for (const { alan, girdi } of girdiler) {
      const a = alan.ad;
      if (alan.tip === 'onay') sonuc[a] = !!girdi.checked;
      else if (alan.tip === 'sayi' || alan.tip === 'para') {
        const ham = String(girdi.value).trim();
        sonuc[a] = ham === '' ? null : Number(ham);
      } else sonuc[a] = String(girdi.value).trim();
    }
    return sonuc;
  }

  function kaydet() {
    const d = deger();
    const eksik = sema.alanlar.filter((a) => a.zorunlu && !d[a.ad]);
    if (eksik.length) {
      form.prepend(el('div', { class: 'kart', style: { borderColor: 'var(--tehlike)', marginBottom: '12px' } },
        el('p', { class: 'metin-k', style: { color: 'var(--tehlike)' }, text: `Şu alanlar boş: ${eksik.map((a) => a.etiket).join(', ')}` })));
      return;
    }
    form.dispatchEvent(new CustomEvent('kaydet', { detail: d, bubbles: true }));
  }

  form.appendChild(kutu);
  return { dugum: form, deger, kaydet };
}

/** Panel içinde form açar, kaydet dediğinde onKaydet(d) çağırır. */
export function formPanelAc(tur, mevcut, onKaydet, { baslik, yeniMi } = {}) {
  const sema = ALANLAR[tur];
  const { dugum, kaydet } = formDugumu(tur, mevcut);
  const kaydetDugmesi = el('button', { class: 'dugme dugme--ana dugme--tam', type: 'button', onclick: () => kaydet() }, 'Kaydet');
  const { kapat } = panelAc(
    baslik || `${yeniMi ? 'Ekle' : 'Düzenle'}: ${sema.ad}`,
    dugum,
    {
      altDugmeler: [
        el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => kapat() }, 'Vazgeç'),
        kaydetDugmesi,
      ],
    },
  );
  dugum.addEventListener('kaydet', (olay) => {
    const d = olay.detail;
    if (!d) return;
    onKaydet(d);
    kapat();
  });
  const ilk = dugum.querySelector('input:not([type=checkbox]), textarea');
  if (ilk) ilk.focus();
  return { kapat };
}

function oku(deger, yedek = '') {
  return deger === null || deger === undefined || deger === '' ? yedek : deger;
}

/** Bir kaydı listede gösteren kart. */
export function satirDugumu(tur, kayit, { onDuzenle, onSil, onTikla } = {}) {
  const sema = ALANLAR[tur];
  const kart = el('div', { class: 'satir-kart' });
  const ust = el('div', { class: 'satir-kart__ust' });
  let baslikMetni = '';
  let degerMetni = '';
  let rozetler = [];

  switch (tur) {
    case 'malzemeler':
      baslikMetni = oku(kayit.ad, 'Adsız malzeme');
      degerMetni = kayit.birimFiyat === null || kayit.birimFiyat === undefined
        ? 'fiyat yok'
        : para((Number(kayit.adet) || 0) * (Number(kayit.birimFiyat) || 0));
      if (kayit.aldi) rozetler.push(el('span', { class: 'rozet rozet--basari', text: 'Aldım' }));
      if (kayit.fiyatDurumu === 'bilinmiyor') rozetler.push(el('span', { class: 'rozet rozet--uyari', text: 'fiyat bilinmiyor' }));
      else if (kayit.fiyatDurumu === 'tahmin') rozetler.push(el('span', { class: 'rozet rozet--uyari', text: 'tahmini' }));
      break;
    case 'adimlar':
      baslikMetni = `${kayit.sira || '·'}. ${oku(kayit.baslik, 'Adsız adım')}`;
      if (kayit.tamamlandi) rozetler.push(el('span', { class: 'rozet rozet--basari', text: 'Bitti' }));
      break;
    case 'ogrenilecekler':
      baslikMetni = oku(kayit.konu, 'Adsız konu');
      degerMetni = (OGRENME_SEVIYELERI.find((s) => s.kod === kayit.seviye) || {}).ad || '';
      if (kayit.ogrenildi) rozetler.push(el('span', { class: 'rozet rozet--basari', text: 'Öğrendim' }));
      break;
    case 'zorluklar':
      baslikMetni = oku(kayit.sorun, 'Adsız zorluk');
      degerMetni = (ZORLUK_SEVIYELERI.find((s) => s.kod === kayit.seviye) || {}).ad || '';
      if (kayit.asildi) rozetler.push(el('span', { class: 'rozet rozet--basari', text: 'Aştım' }));
      break;
    case 'notlar':
      baslikMetni = oku(kayit.metin, '');
      degerMetni = tarih(kayit.tarih);
      break;
    case 'sozluk':
      baslikMetni = oku(kayit.terim, 'Adsız');
      degerMetni = '';
      if (kayit.favori) rozetler.push(el('span', { class: 'rozet rozet--vurgu', text: '⭐' }));
      break;
    default:
      baslikMetni = JSON.stringify(kayit);
  }

  const baslik = el('div', {
    class: 'satir-kart__baslik' + ((tur === 'adimlar' || tur === 'notlar' || tur === 'sozluk') && kayit.tamamlandi ? ' yapildi' : ''),
    text: baslikMetni,
  });
  ust.appendChild(baslik);
  if (degerMetni) ust.appendChild(el('div', { class: 'satir-kart__deger', text: degerMetni }));
  kart.appendChild(ust);

  if (rozetler.length) kart.appendChild(el('div', { class: 'rozetlar' }, rozetler));

  const alt = [];
  if (tur === 'malzemeler' && (Number(kayit.adet) || 0) !== 1) alt.push(`${kayit.adet} adet × ${para(kayit.birimFiyat)}`);
  if (tur === 'malzemeler' && kayit.not) alt.push(kayit.not);
  if (tur === 'malzemeler' && kayit.fiyatDurumu && kayit.fiyatDurumu !== 'gercek') {
    alt.push(kayit.fiyatDurumu === 'bilinmiyor' ? 'fiyat bilinmiyor' : 'fiyat tahmini');
  }
  if (tur === 'malzemeler' && kayit.kaynak) alt.push(`kaynak: ${kayit.kaynak}`);
  if (tur === 'malzemeler' && kayit.kontrolTarihi) alt.push(`kontrol: ${kayit.kontrolTarihi}`);
  if (tur === 'adimlar' && kayit.aciklama) alt.push(kayit.aciklama);
  if (tur === 'ogrenilecekler' && kayit.kaynak) alt.push(`Kaynak: ${kayit.kaynak}`);
  if (tur === 'zorluklar' && kayit.cozum) alt.push(`Çözüm: ${kayit.cozum}`);
  if (tur === 'sozluk' && kayit.anlam) alt.push(kayit.anlam);
  if (alt.length) kart.appendChild(el('div', { class: 'satir-kart__not', text: alt.join(' · ') }));

  const eylemler = el('div', { class: 'satir-kart__eylemler' });
  const tikla = (h) => (e) => { e.stopPropagation(); h(e); };

  if (tur === 'adimlar' && onTikla) {
    eylemler.appendChild(el('button', {
      class: `dugme dugme--kucuk ${kayit.tamamlandi ? 'dugme--sessiz' : ''}`,
      type: 'button', onclick: tikla(() => onTikla(kayit)),
    }, kayit.tamamlandi ? '↩ Tamamlanmadı' : '✓ Tamamlandı'));
  }
  if (onDuzenle) eylemler.appendChild(el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: tikla(() => onDuzenle(kayit)) }, 'Düzenle'));
  if (onSil) eylemler.appendChild(el('button', { class: 'dugme dugme--kucuk dugme--tehlike', type: 'button', onclick: tikla(() => onSil(kayit)) }, 'Sil'));
  if (eylemler.childElementCount) kart.appendChild(eylemler);

  if (onTikla && tur !== 'adimlar') {
    kart.addEventListener('click', () => onTikla(kayit));
    kart.style.cursor = 'pointer';
  }
  return kart;
}

/** Bir bölümün tamamını gösterir. */
export function listeDugumu(tur, kayitlar, { onEkle, onDuzenle, onSil, onTikla, bosMetin, altDugme } = {}) {
  const kap = el('div', {});
  const sema = ALANLAR[tur];
  const liste = (kayitlar || []).filter(Boolean);

  if (tur === 'malzemeler' && onEkle) {
    const toplam = liste.reduce((t, k) => t + (Number(k.adet) || 0) * (Number(k.birimFiyat) || 0), 0);
    kap.appendChild(el('div', { class: 'toplam-serit' },
      el('div', null,
        el('div', { class: 'ozet-kutu__etiket', text: 'Toplam maliyet' }),
        el('div', { class: 'toplam-serit__deger', text: para(toplam) })),
      el('div', { class: 'metin-bs metin-soluk', text: `${liste.length} kalem` }),
    ));
  }

  if (!liste.length) {
    kap.appendChild(el('div', { class: 'bos' },
      el('div', { class: 'bos__simge', text: '📝' }),
      el('p', { class: 'bos__metin', text: bosMetin || `Henüz ${sema.ad.toLowerCase()} eklenmemiş.` })));
  } else {
    for (const kayit of liste) {
      kap.appendChild(satirDugumu(tur, kayit, { onDuzenle, onSil, onTikla }));
    }
  }

  if (onEkle) {
    kap.appendChild(el('button', {
      class: 'dugme dugme--ana dugme--tam', type: 'button',
      style: { marginTop: '12px' }, onclick: () => onEkle(),
    }, `+ ${sema.ad} ekle`));
  }
  if (altDugme) kap.appendChild(altDugme);
  return kap;
}

export function yeniKayit(tur) {
  const kayit = { id: kisaKim() };
  for (const alan of ALANLAR[tur].alanlar) {
    if (alan.varsayilan !== undefined) kayit[alan.ad] = alan.varsayilan;
    else if (alan.tip === 'sayi' || alan.tip === 'para') kayit[alan.ad] = null;
    else if (alan.tip === 'onay') kayit[alan.ad] = false;
    else kayit[alan.ad] = '';
  }
  return kayit;
}
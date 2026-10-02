// 2) Hayal ekleme / düzenleme formu. Her değişiklik otomatik kaydedilir (veri kaybı olmasın diye).
'use strict';
import { el, temizle, kisaKim } from '../ui/bilesen.js';
import * as depo from '../veri/depo.js';
import { bosHayal, DURUMLAR, KATEGORILER } from '../veri/sema.js';
import { ustCiz, git } from '../ana.js';
import { bildir } from '../ui/geri.js';
import { gorselKaydet, gorselSil, gorselUrl } from '../ui/gorsel.js';

const SURE_SECENEKLERI = [
  { ad: 'Belirtmedim', deger: null },
  { ad: 'Birkaç saat', deger: 0.2 },
  { ad: '1 gün', deger: 1 },
  { ad: '2–3 gün', deger: 3 },
  { ad: '1 hafta', deger: 7 },
  { ad: '2–4 hafta', deger: 21 },
  { ad: '1–3 ay', deger: 60 },
  { ad: '6 ay ve fazlası', deger: 180 },
];

function alan(etiket, cocuk, ipucu) {
  return el('div', { class: 'alan' },
    el('span', { class: 'alan__etiket', text: etiket }),
    cocuk,
    ipucu ? el('span', { class: 'alan__ipucu', text: ipucu }) : null);
}

function puanSecici(deger, enBuyuk, degisince, temizlenebilir) {
  const kap = el('div', { class: 'puan', role: 'group' });
  const dugmeler = [];
  const ciz = (yeni) => dugmeler.forEach((d) => d.setAttribute('aria-pressed', Number(d.dataset.puan) === Number(yeni) ? 'true' : 'false'));
  for (let p = 1; p <= enBuyuk; p += 1) {
    const d = el('button', {
      class: 'puan__dugme', type: 'button', 'aria-pressed': Number(deger) === p ? 'true' : 'false',
      veri: { puan: p }, onclick: () => {
        const yeni = Number(deger) === p && temizlenebilir ? null : p;
        degisince(yeni); deger = yeni; ciz(yeni);
      },
    }, String(p));
    dugmeler.push(d);
    kap.appendChild(d);
  }
  return kap;
}

export async function duzenleEkrani(id) {
  const a = temizle(document.getElementById('ana'));
  let kayit = null;
  if (id) kayit = await depo.getir('isler', id);
  if (id && !kayit) {
    bildir('Hayal bulunamadı.');
    git('#/hayaller');
    return { ad: 'duzenle' };
  }
  const yeniMi = !kayit;
  const ilk = yeniMi ? bosHayal() : kayit;
  const model = { ...bosHayal(), ...ilk };
  let kaydetZaman = null;

  const durumGosterge = el('span', { class: 'metin-bs metin-soluk', text: 'Kaydediliyor…' });
  let sonKaydet = 0;

  async function kaydetGoster(anlik = false) {
    clearTimeout(kaydetZaman);
    kaydetZaman = setTimeout(async () => {
      const simdi = Date.now();
      if (simdi - sonKaydet < 300 && !anlik) { kaydetGoster(); return; }
      sonKaydet = simdi;
      if (!model.baslik.trim() && yeniMi) { durumGosterge.textContent = 'Başlığı yazınca kaydedilir'; return; }
      if (!model.id) model.id = kisaKim();
      model.guncelleme = new Date().toISOString();
      if (yeniMi) model.olusturma = model.olusturma || model.guncelleme;
      await depo.isKaydet(model);
      durumGosterge.textContent = `✓ Kaydedildi · ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    }, anlik ? 0 : 700);
  }

  /* ---- Başlık ---- */
  const baslikGirdi = el('input', {
    class: 'girdi', type: 'text', value: model.baslik, placeholder: 'Örn. Evdeki koltukları boyamak',
    maxLength: 120,
    oninput: (o) => { model.baslik = o.target.value; kaydetGoster(); },
  });
  const kalanSayac = el('span', { class: 'alan__ipucu', text: `${(model.baslik || '').length}/120 · otomatik kaydedilir` });
  baslikGirdi.addEventListener('input', () => { kalanSayac.textContent = `${baslikGirdi.value.length}/120 · otomatik kaydedilir`; });
  const baslikAlani = alan('Başlık *', baslikGirdi);
  baslikAlani.appendChild(kalanSayac);

  /* ---- Açıklama ---- */
  const aciklamaGirdi = el('textarea', {
    class: 'metin-alani', rows: 4, placeholder: 'Neden bu hayal? Ne olunca "bitti" sayılır?',
    value: model.aciklama,
    oninput: (o) => { model.aciklama = o.target.value; kaydetGoster(); },
  });

  /* ---- Kategori ---- */
  const listeId = 'kategori-listesi';
  const kategoriGirdi = el('input', {
    class: 'girdi', type: 'text', list: listeId, value: model.kategori || '', placeholder: 'Örn. Ev, Mutfak, Atölye',
    oninput: (o) => { model.kategori = o.target.value.trim(); kaydetGoster(); },
  });
  const kategoriListe = el('datalist', { id: listeId }, KATEGORILER.map((k) => el('option', { value: k })));

  /* ---- Durum ---- */
  const durumSec = el('select', {
    class: 'secim', onchange: (o) => { model.durum = o.target.value; kaydetGoster(true); },
  }, DURUMLAR.map((d) => el('option', { value: d.kod, selected: model.durum === d.kod }, d.ad)));

  /* ---- İstek puanı (1–10) ---- */
  const istekDugmeleri = puanSecici(model.istekPuani, 10, (v) => { model.istekPuani = v; kaydetGoster(); }, true);

  /* ---- Bütçe ---- */
  const butceGirdi = el('input', {
    class: 'girdi', type: 'number', inputmode: 'decimal', step: 'any', min: '0',
    value: model.butce ?? '', placeholder: '0',
    oninput: (o) => { model.butce = o.target.value === '' ? null : Number(o.target.value); kaydetGoster(); },
  });

  /* ---- Hedef tarih ---- */
  const tarihGirdi = el('input', {
    class: 'girdi', type: 'date', value: model.hedefTarih || '',
    onchange: (o) => { model.hedefTarih = o.target.value || null; kaydetGoster(true); },
  });

  /* ---- Zorluk puanı (isteğe bağlı) ---- */
  const zorlukIpucu = el('span', { class: 'alan__ipucu', text: 'Boş bırakırsan Zorluklar bölümünden otomatik hesaplanır.' });
  const zorlukDugmeleri = puanSecici(model.zorlukPuani, 5, (v) => { model.zorlukPuani = v; kaydetGoster(); }, true);

  /* ---- Süre tahmini (isteğe bağlı) ---- */
  const sureSec = el('select', {
    class: 'secim', onchange: (o) => { model.sureGun = o.target.value === '' ? null : Number(o.target.value); kaydetGoster(true); },
  }, SURE_SECENEKLERI.map((s) => el('option', {
    value: s.deger === null ? '' : s.deger, selected: Number(model.sureGun) === Number(s.deger) || (!model.sureGun && s.deger === null),
  }, s.ad)));

  /* ---- Fotoğraf ---- */
  const onizleme = el('img', { class: 'gorsel-onizleme', alt: 'Seçilen fotoğraf', style: model.fotoId ? {} : { display: 'none' } });
  const dosyaGirdi = el('input', {
    class: 'girdi', type: 'file', accept: 'image/*', style: { display: 'none' },
    onchange: async (o) => {
      const dosya = o.target.files && o.target.files[0];
      if (!dosya) return;
      try {
        durumGosterge.textContent = 'Fotoğraf işleniyor…';
        const kayitGorsel = await gorselKaydet(dosya);
        if (model.fotoId) await gorselSil(model.fotoId);
        model.fotoId = kayitGorsel.id;
        onizleme.style.display = '';
        onizleme.src = await gorselUrl(model.fotoId);
        kaydetGoster(true);
        bildir('Fotoğraf eklendi.');
      } catch (hata) {
        bildir(`Fotoğraf eklenemedi: ${hata.message}`);
      } finally {
        o.target.value = '';
      }
    },
  });
  const fotoDugme = el('button', {
    class: 'dugme dugme--tam', type: 'button', onclick: () => dosyaGirdi.click(),
  }, model.fotoId ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle (isteğe bağlı)');
  const fotoSil = model.fotoId
    ? el('button', {
      class: 'dugme dugme--tam dugme--tehlike', type: 'button', onclick: async () => {
        await gorselSil(model.fotoId);
        model.fotoId = null;
        onizleme.style.display = 'none';
        onizleme.removeAttribute('src');
        fotoDugme.textContent = 'Fotoğraf ekle (isteğe bağlı)';
        kaydetGoster(true);
        bildir('Fotoğraf kaldırıldı.');
      },
    }, 'Fotoğrafı kaldır')
    : null;
  const fotoKutusu = el('div', { class: 'gorsel-secici' }, onizleme, el('div', { class: 'sira' }, dosyaGirdi, fotoDugme, fotoSil));
  if (model.fotoId) gorselUrl(model.fotoId).then((url) => { if (url) onizleme.src = url; });

  /* ---- Deneyim ve koşullar (araştırma komutuna gider) ---- */
  const deneyimGirdi = el('textarea', {
    class: 'metin-alani', rows: 3, value: model.deneyim || '',
    placeholder: 'Örn. Daha önce 2 kez yağlı boya yaptım, zımparalamayı biliyorum; vernik hiç kullanmadım.',
    oninput: (o) => { model.deneyim = o.target.value; kaydetGoster(); },
  });
  const kosullarGirdi = el('textarea', {
    class: 'metin-alani', rows: 3, value: model.kosullar || '',
    placeholder: 'Örn. Koltuğu balkona çıkarabilirim; alerjim var, kokusuz ürün şart; hafta sonu yapacağım.',
    oninput: (o) => { model.kosullar = o.target.value; kaydetGoster(); },
  });

  a.appendChild(el('div', { class: 'kart' },
    baslikAlani,
    alan('Açıklama', aciklamaGirdi, 'Kendine ve gelecekteki kendine not.'),
    alan('Kategori', el('div', {}, kategoriListe, kategoriGirdi)),
    el('div', { class: 'sira sira--iki' },
      el('div', { class: 'alan' }, el('span', { class: 'alan__etiket', text: 'Durum' }), durumSec),
      el('div', { class: 'alan' }, el('span', { class: 'alan__etiket', text: 'Hedef tarih' }), tarihGirdi)),
    alan('İstek puanı (1–10)', istekDugmeleri, 'Bu puanı yalnızca sen belirlersin. Boş bırakırsan sıralamada hesaba katılmaz.'),
    alan('Bütçe (₺)', butceGirdi, 'Ayrabilececeğin üst sınır. Maliyet puanı bu bütçeye göre hesaplanır.'),
  ));

  a.appendChild(el('div', { class: 'kart', style: { marginTop: '12px' } },
    el('div', { class: 'bolum__ust' }, el('h2', { class: 'bolum__baslik', text: 'Araştırma için' })),
    el('p', { class: 'alan__ipucu', style: { margin: '-4px 0 12px' },
      text: 'Bu iki alan, "Araştırma komutunu kopyala" dediğinde komutun içine yazılır.' }),
    alan('Deneyimim', deneyimGirdi, 'Bu işi daha önce yaptın mı? Neleri biliyorsun, neleri bilmiyorsun?'),
    alan('Benim eklediğim koşullar', kosullarGirdi, 'Yer, kısıt, alerji, süre, tercih… Araştırma bunlara göre yapılır.'),
  ));

  a.appendChild(el('div', { class: 'kart', style: { marginTop: '12px' } },
    el('div', { class: 'bolum__ust' }, el('h2', { class: 'bolum__baslik', text: 'İsteğe bağlı' })),
    el('div', { class: 'alan' },
      el('span', { class: 'alan__etiket', text: 'Fotoğraf' }), fotoKutusu),
    el('div', { class: 'alan' }, el('span', { class: 'alan__etiket', text: 'Zorluk puanı (1–5)' }), zorlukDugmeleri, zorlukIpucu),
    el('div', { class: 'alan' }, el('span', { class: 'alan__etiket', text: 'Süre tahmini' }), sureSec,
      el('span', { class: 'alan__ipucu', text: 'Sadece sıralamada kullanılır; zorunlu değildir.' })),
  ));

  a.appendChild(el('div', { class: 'bolum', style: { textAlign: 'center' } },
    durumGosterge,
    el('p', { class: 'metin-bs metin-soluk', style: { marginTop: '8px' },
      text: 'Malzeme, adım, öğrenilecekler ve notlar kaydettikten sonra detay sayfasından eklenir.' })));

  const kaydetVeCik = async () => {
    await kaydetGoster(true);
    git(model.id ? `#/hayal/${model.id}` : '#/hayaller');
  };
  a.appendChild(el('div', { class: 'bolum', style: { display: 'grid', gap: '10px' } },
    el('button', { class: 'dugme dugme--ana dugme--tam', type: 'button', onclick: kaydetVeCik }, 'Kaydet ve kapat'),
    yeniMi ? null : el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => git(`#/hayal/${model.id}`) }, 'Vazgeç'),
  ));

  if (!yeniMi) baslikGirdi.focus();
  ustCiz({
    baslik: yeniMi ? 'Yeni hayal' : 'Hayalı düzenle',
    altBaslik: yeniMi ? 'Başlığı yaz, gerisini sonra eklersin' : (kayit.baslik || ''),
    geri: !yeniMi,
    sagEylemler: [el('button', { class: 'dugme dugme--ana dugme--kucuk', type: 'button', onclick: kaydetVeCik }, 'Kaydet')],
  });

  return { ad: 'duzenle' };
}
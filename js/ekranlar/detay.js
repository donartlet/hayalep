// 3) Hayal detay sayfası: Özet / Malzemeler ve maliyet / Yapım adımları / Öğrenilecekler / Zorluklar / Notlar
'use strict';
import { el, temizle, para, tarih, tarihSaat } from '../ui/bilesen.js';
import * as depo from '../veri/depo.js';
import { toplamMaliyet, harcananMaliyet, ilerleme, onerilenPuan, zorlukPuani, durumBilgisi } from '../veri/puanlama.js';
import { ustCiz, git, durum } from '../ana.js';
import { bildir, onaySor } from '../ui/geri.js';
import { listeDugumu, formPanelAc, yeniKayit } from '../ui/bolum.js';
import { gorselUrl } from '../ui/gorsel.js';

const SEKMELER = [
  { kod: 'ozet', ad: 'Özet' },
  { kod: 'malzemeler', ad: 'Malzeme & Maliyet' },
  { kod: 'adimlar', ad: 'Yapım adımları' },
  { kod: 'ogrenilecekler', ad: 'Öğrenilecekler' },
  { kod: 'zorluklar', ad: 'Zorluklar' },
  { kod: 'notlar', ad: 'Notlar' },
];

export async function detayEkrani(id, sekmeKodu = 'ozet') {
  const a = temizle(document.getElementById('ana'));
  let is = await depo.getir('isler', id);
  if (!is || is.silindi) {
    bildir('Bu hayal bulunamadı veya çöpte.');
    git('#/hayaller');
    return { ad: 'detay' };
  }

  async function kaydetVeCiz() {
    await depo.isKaydet(is);
    await detayEkrani(id, sekmeKodu);
  }

  function listeGuncelle(tur, kayitlar) {
    is[tur] = kayitlar;
    return kaydetVeCiz();
  }

  function bolumEkle(tur) {
    formPanelAc(tur, yeniKayit(tur), (yeni) => {
      if (!yeni || !yeni.id) return;
      const liste = [...(is[tur] || [])];
      if (tur === 'adimlar') {
        yeni.sira = (liste.reduce((m, x) => Math.max(m, Number(x.sira) || 0), 0) + 1);
        liste.push(yeni);
        liste.sort((x, y2) => (Number(x.sira) || 0) - (Number(y2.sira) || 0));
      } else liste.push(yeni);
      is[tur] = liste;
      kaydetVeCiz();
    }, { yeniMi: true });
  }

  function bolumDuzenle(tur, kayit) {
    formPanelAc(tur, kayit, (guncel) => {
      if (!guncel) return;
      is[tur] = (is[tur] || []).map((k) => (k.id === kayit.id ? { ...k, ...guncel } : k));
      kaydetVeCiz();
    }, { baslik: `Düzenle: ${kayit.baslik || kayit.ad || kayit.sorun || kayit.konu || ''}`.slice(0, 60) });
  }

  function bolumSil(tur, kayit) {
    const ad = kayit.ad || kayit.baslik || kayit.konu || kayit.sorun || 'kayıt';
    const kopya = is[tur].map((k) => ({ ...k }));
    listeGuncelle(tur, kopya.filter((k) => k.id !== kayit.id)).then(() => {
      bildir(`"${String(ad).slice(0, 40)}" silindi`, {
        eylemAd: 'Geri al',
        eylem: () => listeGuncelle(tur, kopya),
        sure: 9000,
      });
    });
  }

  /* ---------------- Özet sekmesi ---------------- */
  const dever = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
  const round1 = (n) => Math.round(n * 10) / 10;

  function ozetSekmesi() {
    const kap = el('div');
    const d = durumBilgisi(is.durum);
    const maliyet = toplamMaliyet(is);

    if (is.fotoId) {
      const img = el('img', { class: 'detay-gorsel', alt: is.baslik, decoding: 'async' });
      gorselUrl(is.fotoId).then((url) => { if (url) img.src = url; else img.remove(); });
      kap.appendChild(img);
    }

    const kutu = (etiket, deger, vurgu) => el('div', { class: 'detay-ozet__kutu' },
      el('div', { class: 'ozet-kutu__etiket', text: etiket }),
      el('div', { class: 'detay-ozet__deger', style: vurgu ? { color: 'var(--vurgu)' } : {}, text: dever(deger) }));

    kap.appendChild(el('div', { class: 'detay-ozet' },
      kutu('İstek puanı', is.istekPuani ? `${is.istekPuani}/10` : '—', true),
      kutu('Maliyet', maliyet ? para(maliyet) : '—'),
      kutu('Bütçe', is.butce ? para(is.butce) : '—'),
      kutu('Zorluk', zorlukPuani(is) ? `${round1(zorlukPuani(is))}/5` : '—'),
      kutu('Durum', d.ad),
      kutu('Önerilen puan', onerilenPuan(is, durum.ayarlar).toFixed(0)),
    ));

    if (is.aciklama) {
      kap.appendChild(el('div', { class: 'kart', style: { marginTop: '12px', whiteSpace: 'pre-wrap' }, text: is.aciklama }));
    }

    const detaySatirlari = [];
    if (is.kategori) detaySatirlari.push(['Kategori', is.kategori]);
    if (is.hedefTarih) detaySatirlari.push(['Hedef tarih', tarih(is.hedefTarih)]);
    if (is.sureGun) detaySatirlari.push(['Süre tahmini', sureMetni(is.sureGun)]);
    if (maliyet) detaySatirlari.push(['Harcanan (alınan malzeme)', para(harcananMaliyet(is))]);
    detaySatirlari.push(['Oluşturulma', tarihSaat(is.olusturma)]);
    detaySatirlari.push(['Son güncelleme', tarihSaat(is.guncelleme)]);
    if (is.demo) detaySatirlari.push(['Tür', 'Demo kaydı (gerçek kayıtlarından ayrı)']);

    kap.appendChild(el('div', { class: 'kart', style: { marginTop: '12px' } },
      detaySatirlari.map(([e, v]) => el('div', { class: 'ayar-satir', style: { borderBottom: '1px solid var(--cizgi)' } },
        el('div', { class: 'ayar-satir__metin' },
          el('div', { class: 'ayar-satir__alt', text: e }),
          el('div', { class: 'ayar-satir__baslik', text: v }))))));

    const iler = ilerleme(is);
    if ((is.adimlar || []).length) {
      kap.appendChild(el('div', { class: 'bolum' },
        el('div', { class: 'bolum__ust' },
          el('h2', { class: 'bolum__baslik', text: 'Adım ilerlemesi' }),
          el('span', { class: 'metin-k metin-soluk', text: `%${iler}` })),
        el('div', { class: 'ilerleme' }, el('div', { class: 'ilerleme__dolgu', style: { width: `${iler}%` } })),
        el('button', {
          class: 'dugme dugme--sessiz dugme--tam', type: 'button', style: { marginTop: '8px' },
          onclick: () => git(`#/hayal/${is.id}?sekme=adimlar`),
        }, 'Adımlara git →')));
    }

    /* --- Araştırma: iki düğme --- */
    const sonArastirma = is.aiArastirma && is.aiArastirma.sonAktarimTarihi
      ? `Son araştırma: ${tarihSaat(is.aiArastirma.sonAktarimTarihi)}`
      : 'Henüz araştırma yapılmadı';
    kap.appendChild(el('div', { class: 'bolum' },
      el('div', { class: 'bolum__ust' },
        el('h2', { class: 'bolum__baslik', text: 'Araştırma' })),
      el('p', { class: 'alan__ipucu', style: { margin: '-4px 0 10px' }, text: `${sonArastirma}. Uygulama SpaceBunny'ye bağlanmaz; komutu kopyalayıp cevabı yapıştırırsın.` }),
      el('div', { class: 'sira', style: { gap: '10px' } },
        el('button', {
          class: 'dugme dugme--ana dugme--tam', type: 'button',
          onclick: () => git(`#/hayal/${is.id}/arastirma`),
        }, '🔎 Araştırma komutunu kopyala'),
        el('button', {
          class: 'dugme dugme--tam', type: 'button',
          onclick: () => git(`#/hayal/${is.id}/arastirma`),
        }, '📥 Araştırma sonucunu içe aktar'))));

    kap.appendChild(el('div', { class: 'bolum', style: { display: 'grid', gap: '10px' } },
      el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => git(`#/hayal/${is.id}/duzenle`) }, '✎ Düzenle'),
      el('button', {
        class: 'dugme dugme--tam', type: 'button',
        onclick: async () => {
          const evet = await onaySor({
            baslik: 'Hayalı çöpe taşı',
            mesaj: `"${is.baslik}" çöp kutusuna taşınacak. Ayarlar → Çöp kutusundan geri alabilirsin.`,
            onayAd: 'Çöpe taşı', tehlike: true,
          });
          if (!evet) return;
          is.silindi = true;
          is.silinmeZamani = new Date().toISOString();
          const kopya = { ...is };
          await depo.isKaydet(is);
          git('#/ayarlar');
          bildir('Çöpe taşındı', {
            eylemAd: 'Geri al',
            eylem: async () => { kopya.silindi = false; kopya.silinmeZamani = null; await depo.isKaydet(kopya); git(`#/hayal/${kopya.id}`); },
            sure: 10000,
          });
        },
      }, '🗑 Çöpe taşı'),
    ));
    return kap;
  }

  /* ---------------- Bölüm sekmeleri ---------------- */
  function bolumSekmesi(kod) {
    const tur = kod;
    const kap = el('div');
    if (tur === 'malzemeler') {
      const kalan = (is.butce || 0) - toplamMaliyet(is);
      if (is.butce) {
        kap.appendChild(el('div', { class: 'bolum__ust' },
          el('span', { class: 'metin-k metin-soluk', text: `Bütçeden kalan: ` }),
          el('span', { class: 'metin-k', style: { color: kalan < 0 ? 'var(--tehlike)' : 'var(--basari)' }, text: para(kalan) })));
      }
      kap.appendChild(listeDugumu('malzemeler', is.malzemeler, {
        onEkle: () => bolumEkle('malzemeler'),
        onDuzenle: (k) => bolumDuzenle('malzemeler', k),
        onSil: (k) => bolumSil('malzemeler', k),
        bosMetin: 'Malzeme ekle: ne alacaksın, kaç adet, ne kadar tutacak?',
      }));
      kap.appendChild(el('p', { class: 'alan__ipucu', style: { marginTop: '10px' },
        text: 'Toplam maliyet kalemlerden otomatik hesaplanır. "Aldım" işaretlediğin kalemler harcanan olarak da gösterilir.' }));
    } else if (tur === 'adimlar') {
      const iler = ilerleme(is);
      kap.appendChild(el('div', { class: 'bolum__ust' },
        el('h2', { class: 'bolum__baslik', text: 'Adımlar' }),
        el('span', { class: 'metin-k metin-soluk', text: `%${iler} bitti` })));
      kap.appendChild(el('div', { class: 'ilerleme', style: { marginBottom: '12px' } },
        el('div', { class: 'ilerleme__dolgu', style: { width: `${iler}%` } })));
      kap.appendChild(listeDugumu('adimlar', is.adimlar, {
        onEkle: () => bolumEkle('adimlar'),
        onDuzenle: (k) => bolumDuzenle('adimlar', k),
        onSil: (k) => bolumSil('adimlar', k),
        onTikla: async (k) => { k.tamamlandi = !k.tamamlandi; await depo.isKaydet(is); await detayEkrani(id, sekmeKodu); },
        bosMetin: 'İlk adımı yaz: neyi, hangi sırayla yapacaksın?',
      }));
    } else if (tur === 'ogrenilecekler') {
      kap.appendChild(listeDugumu('ogrenilecekler', is.ogrenilecekler, {
        onEkle: () => bolumEkle('ogrenilecekler'),
        onDuzenle: (k) => bolumDuzenle('ogrenilecekler', k),
        onSil: (k) => bolumSil('ogrenilecekler', k),
        bosMetin: 'Bunu yapmak için neyi öğrenmeliyim?',
      }));
    } else if (tur === 'zorluklar') {
      kap.appendChild(listeDugumu('zorluklar', is.zorluklar, {
        onEkle: () => bolumEkle('zorluklar'),
        onDuzenle: (k) => bolumDuzenle('zorluklar', k),
        onSil: (k) => bolumSil('zorluklar', k),
        bosMetin: 'Nerede zorlanıyorsun? Sorunu ve çözümünü yaz.',
      }));
      kap.appendChild(el('p', { class: 'alan__ipucu', style: { marginTop: '10px' },
        text: 'Bu sekmedeki seviyeler, zorluk puanını boş bırakırsan otomatik belirler.' }));
    } else {
      kap.appendChild(listeDugumu('notlar', is.notlar, {
        onEkle: () => bolumEkle('notlar'),
        onDuzenle: (k) => bolumDuzenle('notlar', k),
        onSil: (k) => bolumSil('notlar', k),
        bosMetin: 'Bu hayalle ilgili serbest notlar.',
      }));
    }
    return kap;
  }

  /* ---------------- Çizim ---------------- */
  const sekmeler = el('div', { class: 'sekmeler', role: 'tablist', 'aria-label': 'Bölümler' });
  for (const s of SEKMELER) {
    const adet = Array.isArray(is[s.kod]) ? is[s.kod].length : null;
    sekmeler.appendChild(el('button', {
      class: 'sekme', type: 'button', role: 'tab',
      'aria-selected': s.kod === sekmeKodu ? 'true' : 'false',
      onclick: () => git(`#/hayal/${is.id}?sekme=${s.kod}`),
    }, s.ad, adet ? el('span', { class: 'sekme__sayi', text: String(adet) }) : null));
  }

  const d = durumBilgisi(is.durum);
  a.appendChild(el('div', { class: 'detay-baslik' },
    el('div', { class: 'rozetlar' },
      el('span', { class: `rozet ${d.rozet}`, text: d.ad }),
      is.kategori ? el('span', { class: 'rozet', text: is.kategori }) : null,
      is.demo ? el('span', { class: 'rozet rozet--uyari', text: 'DEMO' }) : null),
    el('h1', { class: 'kart__baslik', style: { fontSize: 'var(--yazi-bh)' }, text: is.baslik }),
  ));
  a.appendChild(sekmeler);
  a.appendChild(sekmeKodu === 'ozet' ? ozetSekmesi() : bolumSekmesi(sekmeKodu));

  ustCiz({
    baslik: 'Hayal detayı',
    altBaslik: is.baslik,
    geri: true,
    sagEylemler: [
      el('button', {
        class: 'dugme dugme--kucuk', type: 'button', onclick: () => git(`#/hayal/${is.id}/duzenle`),
      }, 'Düzenle'),
    ],
  });

  return { ad: 'detay' };
}

function sureMetni(gun) {
  const g = Number(gun);
  if (g < 1) return 'Birkaç saat';
  if (g < 2) return '1 gün';
  if (g < 6) return `${Math.round(g)} gün`;
  if (g < 14) return '1 hafta';
  if (g < 60) return `${Math.round(g / 7)} hafta`;
  return `${Math.round(g / 30)} ay`;
}
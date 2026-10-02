// 4) Kendi sözlüğüm.
'use strict';
import { el, temizle, tarih } from '../ui/bilesen.js';
import * as depo from '../veri/depo.js';
import { bosSozlukKaydi } from '../veri/sema.js';
import { ustCiz } from '../ana.js';
import { bildir, onaySor, panelAc } from '../ui/geri.js';
import { formPanelAc, ALANLAR } from '../ui/bolum.js';

const gorunum = { ara: '', siralama: 'favori' };

export async function sozlukEkrani() {
  const a = temizle(document.getElementById('ana'));
  const tur = el('div');
  let kelimeler = await depo.hepsi('sozluk');

  async function yenile() {
    kelimeler = await depo.hepsi('sozluk');
    ciz();
  }

  /* ---------- Tekil işlemler ---------- */
  function duzenle(kayit) {
    formPanelAc('sozluk', kayit, async (guncel) => {
      guncel.demo = !!kayit.demo;
      guncel.olusturma = kayit.olusturma;
      if (!guncel || !guncel.id) return;
      await depo.yaz('sozluk', guncel);
      bildir('Sözlük kaydı kaydedildi.');
      yenile();
    }, { baslik: 'Sözlük kaydı' });
  }

  async function favoriDegistir(kayit) {
    await depo.yaz('sozluk', { ...kayit, favori: !kayit.favori });
    yenile();
  }

  async function sil(kayit) {
    const evet = await onaySor({
      baslik: 'Sözlük kaydını sil',
      mesaj: `"${kayit.terim}" silinecek. Ekrandaki "Geri al" düğmesiyle 10 saniye içinde geri getirebilirsin.`,
      onayAd: 'Sil', tehlike: true,
    });
    if (!evet) return;
    await depo.sil('sozluk', kayit.id);
    await yenile();
    bildir(`"${kayit.terim}" silindi`, {
      eylemAd: 'Geri al',
      eylem: async () => { await depo.yaz('sozluk', kayit); yenile(); },
      sure: 10000,
    });
  }

  function goster(kayit) {
    const govde = el('div');
    for (const alanTanim of ALANLAR.sozluk.alanlar) {
      const deger = kayit[alanTanim.ad];
      govde.appendChild(el('div', { class: 'ayar-satir', style: { borderBottom: '1px solid var(--cizgi)', minHeight: 'auto', padding: '10px 2px' } },
        el('div', { class: 'ayar-satir__metin' },
          el('div', { class: 'ayar-satir__alt', text: alanTanim.etiket }),
          el('div', { class: 'ayar-satir__baslik', style: { whiteSpace: 'pre-wrap' }, text: alanTanim.ad === 'favori' ? (deger ? 'Evet' : 'Hayır') : (deger ? String(deger) : '—') }))));
    }
    govde.appendChild(el('p', { class: 'alan__ipucu', style: { marginTop: '10px' }, text: `Eklenme: ${tarih(kayit.olusturma)}` }));
    let kapat = () => {};
    kapat = panelAc(kayit.terim, govde, {
      altDugmeler: [
        el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => kapat() }, 'Kapat'),
        el('button', { class: 'dugme dugme--ana dugme--tam', type: 'button', onclick: () => { kapat(); duzenle(kayit); } }, 'Düzenle'),
      ],
    }).kapat;
  }

  function kart(kayit) {
    const dugum = el('div', { class: 'sozluk-kart' },
      el('div', { class: 'rozetlar' },
        el('span', { class: 'sozluk-kart__terim', text: kayit.terim }),
        kayit.favori ? el('span', { class: 'rozet rozet--vurgu', text: '⭐' }) : null,
        kayit.demo ? el('span', { class: 'rozet rozet--uyari', text: 'DEMO' }) : null),
      kayit.anlam ? el('p', { class: 'sozluk-kart__anlam', text: kayit.anlam }) : null,
      kayit.benimNotum ? el('p', { class: 'metin-bs metin-soluk', text: `Notum: ${kayit.benimNotum}` }) : null,
      el('div', { class: 'satir-kart__eylemler', style: { marginTop: '6px' } },
        el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: () => goster(kayit) }, 'Aç'),
        el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: () => duzenle(kayit) }, 'Düzenle'),
        el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: () => favoriDegistir(kayit) }, kayit.favori ? '⭐ çıkar' : '⭐ ekle'),
        el('button', { class: 'dugme dugme--kucuk dugme--tehlike', type: 'button', onclick: () => sil(kayit) }, 'Sil')),
    );
    return dugum;
  }

  /* ---------- Liste ---------- */
  function filtreli() {
    const q = gorunum.ara.trim().toLocaleLowerCase('tr');
    const liste = kelimeler.filter((k) => !q || [k.terim, k.anlam, k.ornek, k.benimNotum]
      .join(' ').toLocaleLowerCase('tr').includes(q));
    if (gorunum.siralama === 'favori') return [...liste].sort((x, y) => (y.favori ? 1 : 0) - (x.favori ? 1 : 0) || x.terim.localeCompare(y.terim, 'tr'));
    if (gorunum.siralama === 'yeni') return [...liste].sort((x, y) => String(y.olusturma).localeCompare(String(x.olusturma)));
    return [...liste].sort((x, y) => x.terim.localeCompare(y.terim, 'tr'));
  }

  function ciz() {
    tur.textContent = '';
    const liste = filtreli();
    if (!kelimeler.length) {
      tur.appendChild(el('div', { class: 'bos' },
        el('div', { class: 'bos__simge', text: '📖' }),
        el('p', { class: 'bos__baslik', text: 'Sözlük boş' }),
        el('p', { class: 'bos__metin', text: 'Öğrendiğin terimleri anlamlarıyla birlikte kaydet.' })));
    } else if (!liste.length) {
      tur.appendChild(el('div', { class: 'bos' },
        el('p', { class: 'bos__baslik', text: 'Sonuç yok' }),
        el('p', { class: 'bos__metin', text: 'Aramayı değiştir.' })));
    } else {
      tur.appendChild(el('p', { class: 'metin-bs metin-soluk', style: { margin: '0 0 8px 2px' }, text: `${liste.length} terim` }));
      for (const k of liste) tur.appendChild(kart(k));
    }
    tur.appendChild(el('button', {
      class: 'dugme dugme--ana dugme--tam', type: 'button', style: { marginTop: '14px' },
      onclick: () => formPanelAc('sozluk', bosSozlukKaydi(), async (yeni) => {
        if (!yeni || !yeni.id) return;
        await depo.yaz('sozluk', yeni);
        bildir('Sözlüğe eklendi.');
        yenile();
      }, { baslik: 'Yeni sözlük kaydı', yeniMi: true }),
    }, '+ Sözlük kaydı ekle'));
  }

  function aracCubugu() {
    return el('div', { class: 'arac' },
      el('div', { class: 'arac__ara' },
        el('span', { class: 'arac__simge', text: '🔍', 'aria-hidden': 'true' }),
        el('input', {
          class: 'girdi', type: 'search', placeholder: 'Sözlükte ara…', value: gorunum.ara, 'aria-label': 'Sözlükte ara',
          oninput: (o) => { gorunum.ara = o.target.value; ciz(); },
        })),
      el('div', { class: 'filtre-satir' },
        el('select', {
          class: 'secim', 'aria-label': 'Sıralama',
          onchange: (o) => { gorunum.siralama = o.target.value; ciz(); },
        },
          el('option', { value: 'favori', selected: gorunum.siralama === 'favori' }, 'Favoriler önce'),
          el('option', { value: 'az', selected: gorunum.siralama === 'az' }, 'A → Z'),
          el('option', { value: 'yeni', selected: gorunum.siralama === 'yeni' }, 'Yeni eklenen'))));
  }

  a.appendChild(aracCubugu());
  a.appendChild(tur);
  ciz();

  ustCiz({
    baslik: 'Sözlüğüm',
    altBaslik: `${kelimeler.length} terim · yalnızca cihazında`,
    sagEylemler: [el('button', {
      class: 'dugme dugme--ana dugme--kucuk', type: 'button',
      onclick: () => formPanelAc('sozluk', bosSozlukKaydi(), async (yeni) => {
        if (!yeni || !yeni.id) return;
        await depo.yaz('sozluk', yeni);
        bildir('Sözlüğe eklendi.');
        yenile();
      }, { baslik: 'Yeni sözlük kaydı', yeniMi: true }),
    }, '+ Ekle')],
  });

  return { ad: 'sozluk' };
}
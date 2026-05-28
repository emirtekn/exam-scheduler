import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LayoutDashboard, Loader2, Edit3, AlertTriangle, ShieldCheck, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const tarihNorm = (t) => (t ? String(t).split('T')[0] : '');
const bolumIdOfDers = (d) => d?.bolum?.bolumId ?? d?.bolumId ?? null;

/** Oturumları saat sırasına göre diz (Kural 9 indeks hesabı) */
const oturumlariSirala = (oturumlar) =>
  [...(oturumlar || [])].sort((a, b) => Number(a.oturumId) - Number(b.oturumId));

const oturumIndeksHaritasi = (siraliOturumlar) => {
  const map = new Map();
  siraliOturumlar.forEach((o, idx) => map.set(Number(o.oturumId), idx));
  return map;
};

/**
 * HATA 1 — Kapasite toplama:
 * Sınavın aynı gün + aynı oturumdaki tüm salon atamalarının kapasite toplamı.
 */
const sinavOturumdakiToplamKapasite = (sinavId, tarih, oturumId, atamalar) =>
  atamalar
    .filter(
      (a) =>
        Number(a.sinavId) === Number(sinavId) &&
        a.tarih === tarih &&
        Number(a.oturum?.oturumId) === Number(oturumId)
    )
    .reduce((toplam, a) => toplam + Number(a.derslik?.kapasite ?? 0), 0);

/**
 * HATA 2 — Sınav o güne tek oturuma kilitli mi?
 * İlk atama yapılan oturum = kilitli oturum; diğer oturumlarda listelenmez.
 */
const sinavGunlukKilitliOturumId = (sinavId, tarih, atamalar) => {
  const gunluk = atamalar.filter(
    (a) => Number(a.sinavId) === Number(sinavId) && a.tarih === tarih
  );
  if (gunluk.length === 0) return null;
  return Number(gunluk[0].oturum?.oturumId);
};

/** Kural 7: personelId|tarih anahtarı ile mazeret kontrolü */
const personelMazeretliMi = (personelId, tarih, mazeretliSet) =>
  mazeretliSet.has(`${Number(personelId)}|${tarih}`);

/**
 * HATA 3 — Kural 9: Arka arkaya en fazla 3 oturum
 * Hedef oturuma eklenirse 4+ ardışık oturum olacaksa, hocayı gizle.
 * Örn: Atanmış [1,2,3] + hedef 4 → ardışık 4 olur → engelle
 */
const ardisikOturumLimitiAsildi = (personelId, tarih, hedefOturumId, atamalar, oturumIndeksMap) => {
  const hedefIdx = oturumIndeksMap.get(Number(hedefOturumId));
  if (hedefIdx === undefined) return false;

  // Gözetmenin bu güne ait tüm atanmış oturum indekslerini bul
  const atananIndeksler = new Set(
    atamalar
      .filter((a) => a.tarih === tarih && Number(a.personel?.personelId) === Number(personelId))
      .map((a) => oturumIndeksMap.get(Number(a.oturum?.oturumId)))
      .filter((idx) => idx !== undefined)
  );
  
  // Hedef oturumu da ekle (sanki atanacak gibi)
  atananIndeksler.add(hedefIdx);

  // Hedef dahil kaç ardışık oturum var?
  let ardisikSayisi = 1; // hedefIdx
  
  // Geriye dönük ardışık kontrol
  let i = hedefIdx - 1;
  while (atananIndeksler.has(i)) {
    ardisikSayisi += 1;
    i -= 1;
  }
  
  // İleriye dönük ardışık kontrol
  i = hedefIdx + 1;
  while (atananIndeksler.has(i)) {
    ardisikSayisi += 1;
    i += 1;
  }
  
  // 4+ ardışık oturum olacaksa engelle (max 3 kuralı)
  return ardisikSayisi >= 4;
};

const Dashboard = () => {
  const [derslikler, setDerslikler] = useState([]);
  const [oturumlar, setOturumlar] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [atamalar, setAtamalar] = useState([]); 
  const [sinavlar, setSinavlar] = useState([]);
  const [mazeretliSet, setMazeretliSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [otomatikYukleniyor, setOtomatikYukleniyor] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seciliHucre, setSeciliHucre] = useState(null);
  const [seciliSinavId, setSeciliSinavId] = useState('');
  const [seciliPersonelId, setSeciliPersonelId] = useState('');

  // =========================================================================
  // REİSİN EFSANE DOKUNUŞU: DİNAMİK TARİH HESAPLAMA
  // Sınavlar tablosundaki tarihleri çekip, tekrarlananları siliyor ve sıraya diziyor!
  // =========================================================================
  const tarihler = [...new Set(sinavlar.filter(s => s.tarih).map(s => String(s.tarih).split('T')[0]))].sort();

  const verileriGetir = useCallback(async () => {
    try {
      const [dRes, oRes, pRes, atamaRes, sinavRes] = await Promise.all([
        axios.get('http://localhost:8080/api/derslikler/liste'),
        axios.get('http://localhost:8080/api/oturumlar/liste'),
        axios.get('http://localhost:8080/api/personeller/liste'),
        axios.get('http://localhost:8080/api/atamalar/liste'),
        axios.get('http://localhost:8080/api/sinavlar/liste')
      ]);

      let mazeretKayitlari = [];
      try {
        const mRes = await axios.get('http://localhost:8080/api/durumlar/mazeretli');
        mazeretKayitlari = mRes.data || [];
      } catch {
        try {
          const listeRes = await axios.get('http://localhost:8080/api/durumlar/liste');
          mazeretKayitlari = (listeRes.data || []).filter((d) =>
            ['İzinli', 'Raporlu'].includes(d.mazeretTuru)
          );
        } catch {
          mazeretKayitlari = [];
        }
      }

      const mazeretSet = new Set();
      mazeretKayitlari.forEach((r) => {
        const pid = r.personelId ?? r.PersonelID ?? r.personelID;
        const t = tarihNorm(r.tarih ?? r.Tarih);
        if (pid != null && t) mazeretSet.add(`${Number(pid)}|${t}`);
      });
      setMazeretliSet(mazeretSet);
      
      setDerslikler(dRes.data); setOturumlar(oRes.data);
      setPersoneller(pRes.data); setSinavlar(sinavRes.data);
      
      const formatliAtamalar = atamaRes.data.map(row => ({
        sinavId: row.sinavId || row.SINAVID || row.SinavID, 
        tarih: tarihNorm(row.tarih || row.TARIH), 
        oturum: { oturumId: row.oturumId || row.OTURUMID },
        derslik: { derslikId: row.derslikId || row.DERSLIKID, ad: row.derslikAd || row.DERSLIKAD, kapasite: row.kapasite || row.KAPASITE },
        ders: {
          dersId: row.dersId || row.DERSID,
          dersAdi: row.dersAdi || row.DERSADI,
          ogrenciSayisi: row.ogrenciSayisi || row.OGRENCISAYISI,
          yariyil: row.yariyil ?? row.YARIYIL,
          bolumId: row.bolumId ?? row.BOLUMID
        },
        personel: { 
            personelId: row.personelId || row.PERSONELID, 
            unvan: row.unvan || row.UNVAN || '', 
            soyad: row.soyad || row.SOYAD || 'Gözetmen Yok' 
        }
      }));
      setAtamalar(formatliAtamalar); 

    } catch (error) {
      console.error(error);
      toast.error("Veriler çekilirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchVeri = async () => {
      if (mounted) await verileriGetir();
    };
    fetchVeri();
    return () => { mounted = false; };
  }, [verileriGetir]);

  const hucreTikla = (tarih, oturum, derslik) => {
    setSeciliHucre({ tarih, oturum, derslik });
    setSeciliSinavId(''); setSeciliPersonelId('');
    setIsModalOpen(true);
  };

  const handleAtamaKaydet = async () => {
    if (!seciliSinavId || !seciliPersonelId) return toast.error("Lütfen seçim yapın!");
    const toastId = toast.loading('Kaydediliyor...');
    try {
      await axios.post('http://localhost:8080/api/atamalar/manuel-kaydet', {
        sinavId: parseInt(seciliSinavId), 
        tarih: seciliHucre.tarih, 
        oturumId: seciliHucre.oturum.oturumId, 
        derslikId: seciliHucre.derslik.derslikId, 
        personelId: parseInt(seciliPersonelId)
      });
      toast.success("Başarıyla kaydedildi.", { id: toastId });
      setIsModalOpen(false);
      await verileriGetir(); 
    } catch (error) {
      const msj = error.response?.data?.message || error.response?.data || "Hata!";
      toast.error(`${msj}`, { id: toastId });
    }
  };

  const handleOtomatikDagit = async () => {
    if (!window.confirm('Henüz atanmamış tüm sınavlar otomatik olarak dağıtılsın mı?\n\nRobot; oturum, salon (kapasite) ve gözetmen atamalarını kısıtlara uygun şekilde yapacaktır.')) {
      return;
    }

    setOtomatikYukleniyor(true);
    const toastId = toast.loading('🤖 Robot çalışıyor, lütfen bekleyin...');

    try {
      const res = await axios.post('http://localhost:8080/api/atamalar/otomatik-dagit');
      const data = res.data || {};

      const basarili = data.basariliSayisi ?? data.basariliSinavlar?.length ?? 0;
      const atanamayanListe = data.atanamayanSinavlar || [];
      const ozet = data.ozetMesaj || 'İşlem tamamlandı.';

      if (basarili > 0) {
        const basariliListe = (data.basariliSinavlar || []).slice(0, 5).join(', ');
        const ek = basarili > 5 ? ` (+${basarili - 5} sınav daha)` : '';
        toast.success(`${ozet}\nAtanan: ${basariliListe}${ek}`, { id: toastId, duration: 6000 });
      } else {
        toast(ozet, { id: toastId, icon: 'ℹ️' });
      }

      if (atanamayanListe.length > 0) {
        toast.error(
          `Atanamayan sınavlar (${atanamayanListe.length}):\n${atanamayanListe.join('\n')}`,
          { duration: 10000 }
        );
      }

      await verileriGetir();
    } catch (error) {
      console.error(error);
      const mesaj = error.response?.data?.ozetMesaj || error.response?.data || 'Otomatik dağıtım sırasında hata oluştu!';
      toast.error(String(mesaj), { id: toastId, duration: 8000 });
    } finally {
      setOtomatikYukleniyor(false);
    }
  };

  const sinavIptalEt = async (hucre) => {
    if (!window.confirm("Bu atamayı iptal etmek istediğinize emin misiniz? Sınav boşa düşecektir.")) return;
    const toastId = toast.loading('İptal ediliyor...');
    try {
      await axios.delete(`http://localhost:8080/api/atamalar/sil/${hucre.sinavId}`);
      toast.success("Atama başarıyla kaldırıldı.", { id: toastId });
      await verileriGetir(); 
    } catch (error) {
      const msj = error.response?.data || "İptal sırasında bir hata oluştu!";
      toast.error(msj, { id: toastId });
    }
  };

  let oGunePlanliSinavlar = [];
  let uygunPersoneller = [];
  const seciliSinav = sinavlar.find((s) => String(s.sinavId) === String(seciliSinavId));
  const seciliSinavBolumId = bolumIdOfDers(seciliSinav?.ders);

  if (seciliHucre) {
    const { tarih, oturum, derslik } = seciliHucre;
    const hedefOturumId = Number(oturum.oturumId);
    const siraliOturumlar = oturumlariSirala(oturumlar);
    const oturumIndeksMap = oturumIndeksHaritasi(siraliOturumlar);
    const hedefIdx = oturumIndeksMap.get(hedefOturumId);
    const komsuOturumIdleri =
      hedefIdx !== undefined
        ? [
            siraliOturumlar[hedefIdx - 1]?.oturumId,
            siraliOturumlar[hedefIdx + 1]?.oturumId
          ]
            .filter((id) => id != null)
            .map(Number)
        : [hedefOturumId - 1, hedefOturumId + 1];

    const bugununSinavlari = sinavlar.filter((s) => tarihNorm(s.tarih) === tarih);

    oGunePlanliSinavlar = bugununSinavlari.filter((sinav) => {
      const sinavId = sinav.sinavId;
      const ogrenciSayisi = Number(sinav.ders?.ogrenciSayisi ?? 0);
      const sinavYariyil = sinav.ders?.yariyil;
      const sinavBolumId = bolumIdOfDers(sinav.ders);

      // Bu hücrede zaten atanmış
      const buHucredeZaten = atamalar.some(
        (a) =>
          Number(a.sinavId) === Number(sinavId) &&
          a.tarih === tarih &&
          Number(a.oturum?.oturumId) === hedefOturumId &&
          Number(a.derslik?.derslikId) === Number(derslik.derslikId)
      );
      if (buHucredeZaten) return false;

      // HATA 2: Sınav o gün yalnızca tek oturumda (farklı saat dilimlerinde tekrar listelenmez)
      const kilitliOturum = sinavGunlukKilitliOturumId(sinavId, tarih, atamalar);
      if (kilitliOturum != null && kilitliOturum !== hedefOturumId) return false;

      // HATA 1: Kapasite dolana kadar aynı oturumdaki diğer boş salonlarda görünmeye devam et
      const toplamAtananKapasite = sinavOturumdakiToplamKapasite(
        sinavId,
        tarih,
        hedefOturumId,
        atamalar
      );
      if (ogrenciSayisi > 0 && toplamAtananKapasite >= ogrenciSayisi) return false;

      if (sinavYariyil != null && sinavBolumId != null) {
        // Kural 1: Başka bir ders aynı oturum + yarıyıl + bölüm (kendi parçalı ataması sayılmaz)
        const baskaDersAyniOturum = atamalar.some(
          (a) =>
            Number(a.sinavId) !== Number(sinavId) &&
            a.tarih === tarih &&
            Number(a.oturum?.oturumId) === hedefOturumId &&
            Number(a.ders?.yariyil) === Number(sinavYariyil) &&
            Number(a.ders?.bolumId ?? bolumIdOfDers(a.ders)) === Number(sinavBolumId)
        );
        if (baskaDersAyniOturum) return false;

        // Kural 1: Komşu oturumlarda aynı yarıyıl + bölüm (başka dersler)
        const komsuBaskaDers = atamalar.some(
          (a) =>
            Number(a.sinavId) !== Number(sinavId) &&
            a.tarih === tarih &&
            komsuOturumIdleri.includes(Number(a.oturum?.oturumId)) &&
            Number(a.ders?.yariyil) === Number(sinavYariyil) &&
            Number(a.ders?.bolumId ?? bolumIdOfDers(a.ders)) === Number(sinavBolumId)
        );
        if (komsuBaskaDers) return false;

        // Kural 2: Aynı yarıyıl + bölüm günde max 2 oturum, peş peşe yasak
        const gunlukOturumlar = new Set(
          atamalar
            .filter(
              (a) =>
                a.tarih === tarih &&
                Number(a.ders?.yariyil) === Number(sinavYariyil) &&
                Number(a.ders?.bolumId ?? bolumIdOfDers(a.ders)) === Number(sinavBolumId)
            )
            .map((a) => Number(a.oturum?.oturumId))
        );
        if (gunlukOturumlar.size >= 2 && !gunlukOturumlar.has(hedefOturumId)) return false;
        if (komsuOturumIdleri.some((oid) => gunlukOturumlar.has(oid))) return false;
      }

      return true;
    });

    uygunPersoneller = personeller
      .filter((p) => {
        // Kural 7: İzinli / Raporlu — kesinlikle gizle
        if (personelMazeretliMi(p.personelId, tarih, mazeretliSet)) return false;

        const hocaninBugunku = atamalar.filter(
          (a) => a.tarih === tarih && Number(a.personel?.personelId) === Number(p.personelId)
        );

        // Kural 5: Aynı oturumda başka salonda
        if (
          hocaninBugunku.some((a) => Number(a.oturum?.oturumId) === hedefOturumId)
        ) {
          return false;
        }

        // HATA 2 FİKSİ — Kural 6: Günde max 4 oturum (eğer 4 oturum atanmışsa, 5. herhangibir oturuma atanAMAZ)
        const gunlukOturumlar = new Set(
          hocaninBugunku
            .map((a) => Number(a.oturum?.oturumId))
            .filter((id) => !Number.isNaN(id))
        );
        // Hedef oturuma atanacaksa toplam = current + 1, değilse = current. Her iki durumda > 4 ise engelle.
        if (gunlukOturumlar.size >= 4) return false;

        // HATA 3 FİKSİ — Kural 9: Arka arkaya max 3 oturum (4. ardışık oturuma atanAMAZ)
        if (
          ardisikOturumLimitiAsildi(
            p.personelId,
            tarih,
            hedefOturumId,
            atamalar,
            oturumIndeksMap
          )
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aKendi =
          seciliSinavBolumId != null && Number(a.bolumId) === Number(seciliSinavBolumId) ? 0 : 1;
        const bKendi =
          seciliSinavBolumId != null && Number(b.bolumId) === Number(seciliSinavBolumId) ? 0 : 1;
        if (aKendi !== bKendi) return aKendi - bKendi;
        return `${a.unvan} ${a.soyad}`.localeCompare(`${b.unvan} ${b.soyad}`, 'tr-TR');
      });
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center"><LayoutDashboard className="mr-2 text-blue-600" /> Sınav Programı</h1>
          <p className="text-gray-500 text-sm mt-1">Sınav planladığınız tarihler tabloda otomatik olarak belirir.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOtomatikDagit}
            disabled={otomatikYukleniyor}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {otomatikYukleniyor ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
            🤖 Tümünü Otomatik Ata
          </button>
          <div className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border">
            <ShieldCheck className="w-5 h-5 mr-2" /> Canlı Denetim Aktif
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto pb-6">
        <table className="w-full table-fixed border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-100 border-b-2">
              <th className="border-r p-4 text-sm font-bold w-48">Oturum / Derslik</th>
              {/* Tarih yoksa boş durmasın diye uyarı sütunu */}
              {tarihler.length === 0 ? (
                <th className="p-4 text-center text-gray-500 italic font-medium">Henüz planlanmış bir sınav bulunamadı.</th>
              ) : (
                tarihler.map(t => <th key={t} className="border-r p-4 text-center">{new Date(t).toLocaleDateString('tr-TR')}</th>)
              )}
            </tr>
          </thead>
          <tbody>
            {oturumlar.map(oturum => (
              <React.Fragment key={oturum.oturumId}>
                <tr className="bg-blue-600 text-white">
                  <td colSpan={tarihler.length === 0 ? 2 : tarihler.length + 1} className="p-2 font-bold text-center text-sm">
                    {oturum.tanim} ({oturum.baslangicSaat})
                  </td>
                </tr>
                {derslikler.map(derslik => (
                  <tr key={oturum.oturumId + derslik.derslikId} className="border-b hover:bg-gray-50">
                    <td className="border-r p-3 font-bold text-center bg-gray-50 text-sm">
                      {derslik.ad} <br/><span className="text-xs text-gray-500">(Kap: {derslik.kapasite})</span>
                    </td>
                    
                    {tarihler.length === 0 ? (
                      <td className="p-4 text-center text-gray-300 bg-gray-50">Lütfen önce sınav planlayın</td>
                    ) : (
                      tarihler.map(tarih => {
                        const hucre = atamalar.find(a => String(a.tarih)===String(tarih) && String(a.oturum?.oturumId)===String(oturum?.oturumId) && String(a.derslik?.derslikId)===String(derslik?.derslikId));
                        return (
                          <td key={tarih + oturum.oturumId + derslik.derslikId} className="border-r p-2 h-24 relative group cursor-pointer" onClick={() => !hucre && hucreTikla(tarih, oturum, derslik)}>
                            {hucre ? (
                              <div className="flex flex-col h-full justify-between bg-emerald-50 rounded p-2 border border-emerald-200">
                                <div className="flex justify-between items-start w-full">
                                  <span className="text-[11px] font-bold text-emerald-800 leading-tight break-words pr-1">{hucre.ders?.dersAdi}</span>
                                  <button onClick={(e) => { e.stopPropagation(); sinavIptalEt(hucre); }} className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded p-1 shrink-0 transition-colors" title="Atamayı İptal Et">
                                    <span className="text-[10px]">❌</span>
                                  </button>
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 border-t border-emerald-200 pt-1 mt-1 block truncate text-left">
                                  👤 {hucre.personel?.unvan} {hucre.personel?.soyad}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300 hover:text-blue-500 transition-all"><Edit3 className="w-5 h-5"/></div>
                            )}
                          </td>
                        );
                      })
                    )}

                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex justify-between"><h3 className="text-white font-bold">Atama Yap</h3><button onClick={() => setIsModalOpen(false)} className="text-white font-bold text-xl">&times;</button></div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 flex"><AlertTriangle className="w-5 h-5 mr-2 shrink-0"/> Kısıtlara uymayan seçenekler gizlenmiştir.</div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Planlanmış Sınavlar ({oGunePlanliSinavlar.length})</label>
                <select value={seciliSinavId} onChange={e => setSeciliSinavId(e.target.value)} className="w-full border-2 rounded-xl px-4 py-3">
                  <option value="">-- Sınav Seçiniz --</option>
                  {oGunePlanliSinavlar.length === 0 && <option disabled>Bu güne ait uygun sınav bulunamadı!</option>}
                  {oGunePlanliSinavlar.map(s => <option key={s.sinavId} value={s.sinavId}>{s.ders?.dersAdi} ({s.ders?.yariyil}. YY)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Uygun Gözetmenler ({uygunPersoneller.length})</label>
                <select value={seciliPersonelId} onChange={e => setSeciliPersonelId(e.target.value)} className="w-full border-2 rounded-xl px-4 py-3">
                  <option value="">-- Gözetmen Seçiniz --</option>
                  {uygunPersoneller.length === 0 && <option disabled>Uygun gözetmen kalmadı!</option>}
                  {uygunPersoneller.map((p) => {
                    const kendiBolum = seciliSinavBolumId != null && Number(p.bolumId) === Number(seciliSinavBolumId);
                    return (
                      <option key={p.personelId} value={p.personelId}>
                        {kendiBolum ? '★ ' : '○ Ortak Havuz — '}{p.unvan} {p.soyad}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button onClick={handleAtamaKaydet} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 flex justify-center items-center"><ShieldCheck className="w-5 h-5 mr-2" /> Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Loader2, BookOpen, CalendarDays, Filter, GraduationCap } from 'lucide-react'; 
import toast from 'react-hot-toast';

const bolumSözlüğü = { 1: "Yazılım Mühendisliği", 2: "Elektrik", 3: "Makine", 4: "Mekatronik", 5: "Enerji" };

const tarihNorm = (t) => (t ? String(t).split('T')[0] : '');
const bolumIdOf = (d) => d?.bolum?.bolumId ?? d?.bolumId ?? null;

/** Seçilen tarihte bölüm+yarıyıl için kaç sınav planlanmış (Kural 2) */
const gunlukSinavSayisi = (sinavlar, tarih, yariyil, bolumId) => {
  if (!tarih || yariyil == null || yariyil === '') return 0;
  return sinavlar.filter((s) => {
    if (tarihNorm(s.tarih) !== tarih) return false;
    if (String(s.ders?.yariyil ?? '') !== String(yariyil)) return false;
    if (bolumId && String(bolumIdOf(s.ders) ?? '') !== String(bolumId)) return false;
    return true;
  }).length;
};

const SinavAtama = () => {
  const bugun = new Date().toISOString().split('T')[0];

  const [filtreBolumId, setFiltreBolumId] = useState('');
  const [filtreYariyil, setFiltreYariyil] = useState('');
  const [secilenDersId, setSecilenDersId] = useState('');
  const [secilenTarih, setSecilenTarih] = useState('');

  const [dersler, setDersler] = useState([]);
  const [sinavlar, setSinavlar] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const verileriGetir = useCallback(async () => {
    try {
      const [dersRes, sinavRes] = await Promise.all([
        axios.get('http://localhost:8080/api/dersler/liste'),
        axios.get('http://localhost:8080/api/sinavlar/liste')
      ]);
      setDersler(dersRes.data);
      setSinavlar(sinavRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Veriler yüklenirken bağlantı hatası!');
    } finally {
      setLoadingPage(false);
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

  const filtrelenmisDersler = dersler.filter((ders) => {
    const dBolumId = bolumIdOf(ders);
    if (filtreBolumId && String(dBolumId) !== String(filtreBolumId)) return false;
    if (filtreYariyil && String(ders.yariyil) !== String(filtreYariyil)) return false;
    return true;
  });

  /** Kural 2: Bu tarihte bölüm+yarıyıl için 2 sınav varsa yarıyıl seçilemez */
  const yariyilDisabledMi = useMemo(() => {
    const map = {};
    if (!secilenTarih) return map;
    for (let y = 1; y <= 8; y++) {
      if (filtreBolumId) {
        map[y] = gunlukSinavSayisi(sinavlar, secilenTarih, y, filtreBolumId) >= 2;
      } else {
        map[y] = Object.keys(bolumSözlüğü).some(
          (bid) => gunlukSinavSayisi(sinavlar, secilenTarih, y, bid) >= 2
        );
      }
    }
    return map;
  }, [secilenTarih, sinavlar, filtreBolumId]);

  const handleSinavSil = async (sinav) => {
    const sinavId = sinav?.sinavId;
    const etiket = `${sinav?.ders?.dersKodu ?? ''} - ${sinav?.ders?.dersAdi ?? 'Sınav'}`.trim();
    if (!sinavId) {
      toast.error('Sınav kimliği bulunamadı.');
      return;
    }
    if (!window.confirm(`Bu sınavı kalıcı olarak silmek istediğinize emin misiniz?\n\n${etiket}`)) {
      return;
    }

    const toastId = toast.loading('Sınav siliniyor...');
    try {
      await axios.delete(`http://localhost:8080/api/sinavlar/sil/${sinavId}`);
      toast.success('Sınav başarıyla silindi.', { id: toastId });
      await verileriGetir();
    } catch (error) {
      console.error(error);
      const mesaj = error.response?.data || 'Sınav silinirken hata oluştu!';
      toast.error(mesaj, { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secilenDersId || !secilenTarih) return toast.error('Lütfen Ders ve Tarih seçin!');

    const secilenDers = dersler.find((d) => String(d.dersId) === String(secilenDersId));
    const yy = secilenDers?.yariyil;
    const bb = bolumIdOf(secilenDers);
    if (gunlukSinavSayisi(sinavlar, secilenTarih, yy, bb) >= 2) {
      return toast.error('KURAL 2: Bu yarıyıl için seçilen günde en fazla 2 sınav planlanabilir!');
    }

    setKaydediliyor(true);
    const toastId = toast.loading('Sınav planlanıyor...');

    try {
      await axios.post('http://localhost:8080/api/sinavlar/ekle', {
        dersId: parseInt(secilenDersId),
        tarih: secilenTarih,
        oturumId: null
      });

      toast.success('Sınav plana eklendi!', { id: toastId });
      setSecilenDersId('');
      setSecilenTarih('');
      await verileriGetir(); 
    } catch (error) {
      console.error(error); 
      const asilHata = error.response?.data || "Hata oluştu!";
      toast.error(asilHata, { id: toastId });
    } finally {
      setKaydediliyor(false);
    }
  };

  if (loadingPage) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Sınav Planlama (Tarih Belirleme)</h1>
        <p className="text-gray-500 text-sm">Derslerin sınav tarihlerini belirleyin. Salon atamaları Sınav Programı&apos;ndan yapılacaktır.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center"><Filter className="w-4 h-4 mr-1"/> Bölüm</label>
              <select value={filtreBolumId} onChange={(e) => setFiltreBolumId(e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none">
                <option value="">Tüm Bölümler</option>
                {Object.entries(bolumSözlüğü).map(([id, isim]) => <option key={id} value={id}>{isim}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center"><GraduationCap className="w-4 h-4 mr-1"/> Yarıyıl</label>
              <select value={filtreYariyil} onChange={(e) => setFiltreYariyil(e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none">
                <option value="">Tüm Yarıyıllar</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option
                    key={num}
                    value={num}
                    disabled={yariyilDisabledMi[num]}
                  >
                    {num}. Yarıyıl{yariyilDisabledMi[num] ? ' (Bu gün dolu - Kural 2)' : ''}
                  </option>
                ))}
              </select>
              {secilenTarih && (
                <p className="text-xs text-amber-700 mt-1">Kural 2: Seçilen tarihte bir yarıyıla en fazla 2 sınav planlanabilir.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2"><BookOpen className="w-4 h-4 inline mr-1 text-blue-500"/> Planlanacak Ders</label>
              <select value={secilenDersId} onChange={(e) => setSecilenDersId(e.target.value)} className="w-full border rounded-lg px-4 py-2.5 outline-none">
                <option value="">-- Ders Seçiniz --</option>
                {filtrelenmisDersler.map((ders) => (
                  <option key={ders.dersId} value={ders.dersId}>{ders.dersKodu} - {ders.dersAdi} ({ders.ogrenciSayisi} Kişi)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2"><CalendarDays className="w-4 h-4 inline mr-1 text-blue-500"/> Sınav Tarihi</label>
              <input type="date" min={bugun} value={secilenTarih} onChange={(e) => setSecilenTarih(e.target.value)} className="w-full border rounded-lg px-4 py-2.5 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={kaydediliyor} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">
            {kaydediliyor ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sınav Tarihini Onayla'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm border-b">
            <tr>
              <th className="p-4">Tarih</th>
              <th className="p-4">Ders Kodu & Adı</th>
              <th className="p-4 text-right">Bölüm</th>
              <th className="p-4 text-center w-24">İşlem</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sinavlar.length === 0 ? (
              <tr><td colSpan="4" className="p-6 text-center text-gray-400">Planlanmış bir sınav yok.</td></tr>
            ) : (
              sinavlar.map((s) => (
                <tr key={s.sinavId} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold">{new Date(s.tarih).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4">{s.ders?.dersKodu} - {s.ders?.dersAdi}</td>
                  <td className="p-4 text-right text-gray-500">{bolumSözlüğü[bolumIdOf(s.ders)] || '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSinavSil(s)}
                      title="Sınavı sil"
                      className="px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm"
                    >
                      Sil ❌
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SinavAtama;

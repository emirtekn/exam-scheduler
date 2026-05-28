import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { List, Loader2, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

/** API'den gelen değeri güvenli string'e çevirir (null/undefined boş string). */
const norm = (v) => (v == null || v === '' ? '' : String(v).trim());

/** Bölüm ID: nested `bolum.bolumId` veya düz `bolumId`. */
const bolumIdOf = (d) => d?.bolum?.bolumId ?? d?.bolumId ?? null;

/** Yarıyıl: olası alan adları. */
const yariyilOf = (d) => d?.yariyil ?? d?.yariYil ?? null;

/** Ders türü metni. */
const turOf = (d) => norm(d?.dersTuru);

const DersYonetimi = () => {
  const [dersler, setDersler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');
  const [filterYariyil, setFilterYariyil] = useState('');
  const [filterBolumId, setFilterBolumId] = useState('');
  const [filterTur, setFilterTur] = useState('');

  // --- API ÇAĞRILARI ---
  const dersleriGetir = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/dersler/liste');
      setDersler(response.data);
    } catch (error) {
      console.error("Backend'den dersler çekilemedi:", error);
      toast.error('Dersler yüklenirken backend bağlantı hatası!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    dersleriGetir();
  }, []);

  const temizle = () => {
    setArama('');
    setFilterBolumId('');
    setFilterTur('');
    setFilterYariyil('');
  };

  const filtreliDersler = useMemo(() => {
    const q = norm(arama).toLocaleLowerCase('tr-TR');
    const fy = norm(filterYariyil);
    const fb = norm(filterBolumId);
    const ft = norm(filterTur).toLocaleLowerCase('tr-TR');

    return (Array.isArray(dersler) ? dersler : []).filter((d) => {
      if (!d) return false;

      const kod = norm(d.dersKodu).toLocaleLowerCase('tr-TR');
      const ad = norm(d.dersAdi).toLocaleLowerCase('tr-TR');
      const matchesArama = !q || kod.includes(q) || ad.includes(q);

      const dYariyil = norm(yariyilOf(d));
      const matchesYariyil = !fy || dYariyil === fy;

      const dBolum = norm(bolumIdOf(d));
      const matchesBolum = !fb || dBolum === fb;

      const dTur = turOf(d).toLocaleLowerCase('tr-TR');
      const matchesTur = !ft || dTur === ft;

      return matchesArama && matchesYariyil && matchesBolum && matchesTur;
    });
  }, [dersler, arama, filterYariyil, filterBolumId, filterTur]);

  // --- ARAYÜZ (RENDER) ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ders Yönetimi</h1>
        <p className="text-gray-500">Sistemde tanımlı (sabit) dersleri görüntüleyin ve filtreleyin.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <List className="text-gray-500 w-5 h-5 mr-2" />
              <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Dersler</h2>
            </div>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Görünen: {filtreliDersler.length} / {dersler.length}
            </span>
          </div>

          <div className="px-6 py-4 border-b bg-white">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Arama</label>
                <input
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  placeholder="Ders kodu veya adı"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Yarıyıl</label>
                  <select
                    value={filterYariyil}
                    onChange={(e) => setFilterYariyil(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}. Yarıyıl
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tür</label>
                  <select
                    value={filterTur}
                    onChange={(e) => setFilterTur(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    <option value="Zorunlu">Zorunlu</option>
                    <option value="Seçmeli">Seçmeli</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bölüm</label>
                  <select
                    value={filterBolumId}
                    onChange={(e) => setFilterBolumId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    <option value="1">Yazılım</option>
                    <option value="2">Elektrik</option>
                    <option value="3">Makine</option>
                    <option value="4">Mekatronik</option>
                    <option value="5">Enerji Sistemleri</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={temizle}
                  className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center"
                >
                  <X className="w-4 h-4 mr-2" /> Temizle
                </button>
                <div className="px-3 py-2 rounded-lg border bg-blue-50 text-blue-700 font-semibold flex items-center">
                  <Filter className="w-4 h-4 mr-2" /> Filtre
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 flex justify-center items-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Veriler yükleniyor...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-semibold">Kodu</th>
                    <th className="p-4 font-semibold">Ders Adı</th>
                    <th className="p-4 font-semibold text-center">Yarıyıl</th>
                    <th className="p-4 font-semibold text-center">Tür</th>
                    <th className="p-4 font-semibold text-center">Öğrenci Sayısı</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtreliDersler.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td>
                    </tr>
                  ) : (
                    filtreliDersler.map((ders, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-blue-600">{ders.dersKodu}</td>
                        <td className="p-4 text-gray-800">{ders.dersAdi}</td>
                        <td className="p-4 text-center font-medium">{ders.yariyil}. Yarıyıl</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${ders.dersTuru === 'Zorunlu' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {ders.dersTuru}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-700">{ders.ogrenciSayisi}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
      </div>
    </div>
  );
};

export default DersYonetimi;
import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Users, List, Loader2, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

// VERİTABANI İLE EŞLEŞEN BÖLÜM SÖZLÜĞÜ (Tabloda ismi yazsın diye)
const bolumSözlüğü = {
  1: "Yazılım Mühendisliği",
  2: "Elektrik Mühendisliği",
  3: "Makine Mühendisliği",
  4: "Mekatronik Mühendisliği",
  5: "Enerji Sistemleri Mühendisliği"
};

const PersonelYonetimi = () => {
  const [personeller, setPersoneller] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');
  const [filterBolumId, setFilterBolumId] = useState('');
  const [filterUnvan, setFilterUnvan] = useState('');

  const personelleriGetir = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/personeller/liste');
      setPersoneller(response.data);
    } catch (error) {
      console.error("Personeller çekilemedi:", error);
      toast.error('Personeller yüklenirken bağlantı hatası!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    personelleriGetir();
  }, []);

  const temizle = () => {
    setArama('');
    setFilterBolumId('');
    setFilterUnvan('');
  };

  const unvanlar = useMemo(() => {
    const set = new Set();
    personeller.forEach((p) => {
      const u = String(p?.unvan ?? '').trim();
      if (u) set.add(u);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [personeller]);

  const filtreliPersoneller = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    return personeller.filter((p) => {
      const adSoyad = `${p?.ad ?? ''} ${p?.soyad ?? ''}`.trim().toLocaleLowerCase('tr-TR');
      const matchesArama = !q || adSoyad.includes(q);
      const matchesBolum = !filterBolumId || String(p?.bolumId ?? '') === String(filterBolumId);
      const matchesUnvan = !filterUnvan || String(p?.unvan ?? '') === String(filterUnvan);
      return matchesArama && matchesBolum && matchesUnvan;
    });
  }, [personeller, arama, filterBolumId, filterUnvan]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h1>
        <p className="text-gray-500">Sistemde tanımlı (sabit) personeli görüntüleyin ve filtreleyin.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <List className="text-gray-500 w-5 h-5 mr-2" />
              <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Personeller</h2>
            </div>
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Görünen: {filtreliPersoneller.length} / {personeller.length}
            </span>
          </div>

          <div className="px-6 py-4 border-b bg-white">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Arama</label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg border bg-emerald-50 text-emerald-700 font-semibold flex items-center">
                    <Users className="w-4 h-4 mr-2" /> Personel
                  </div>
                  <input
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    placeholder="Ad veya soyad"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bölüm</label>
                  <select
                    value={filterBolumId}
                    onChange={(e) => setFilterBolumId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    {Object.entries(bolumSözlüğü).map(([id, isim]) => (
                      <option key={id} value={id}>
                        {isim}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ünvan</label>
                  <select
                    value={filterUnvan}
                    onChange={(e) => setFilterUnvan(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    {unvanlar.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
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
                <div className="px-3 py-2 rounded-lg border bg-emerald-50 text-emerald-700 font-semibold flex items-center">
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
                    <th className="p-4 font-semibold">Ünvan</th>
                    <th className="p-4 font-semibold">Ad Soyad</th>
                    <th className="p-4 font-semibold text-right">Bağlı Olduğu Bölüm</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtreliPersoneller.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-6 text-center text-gray-500">Henüz personel eklenmemiş.</td>
                    </tr>
                  ) : (
                    filtreliPersoneller.map((personel, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-600">{personel.unvan}</td>
                        <td className="p-4 font-bold text-emerald-600 uppercase">{personel.ad} {personel.soyad}</td>
                        {/* Burada Bölüm ID yerine, sözlükten o ID'nin karşılığı olan metni yazdırıyoruz */}
                        <td className="p-4 text-gray-700 font-medium text-right bg-gray-50/50">
                          {bolumSözlüğü[personel.bolumId] || `Bölüm ${personel.bolumId}`}
                        </td>
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

export default PersonelYonetimi;
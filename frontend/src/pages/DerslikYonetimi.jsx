import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Building, List, Loader2, CheckCircle, XCircle, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DerslikYonetimi = () => {
  const [derslikler, setDerslikler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');
  const [filterTip, setFilterTip] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
  const [filterKat, setFilterKat] = useState('');

  const derslikleriGetir = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/derslikler/liste');
      setDerslikler(response.data);
    } catch (error) {
      console.error("Derslikler çekilemedi:", error);
      toast.error('Derslikler yüklenirken bağlantı hatası!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    derslikleriGetir();
  }, []);

  const temizle = () => {
    setArama('');
    setFilterTip('');
    setFilterAktif('');
    setFilterKat('');
  };

  const filtreliDerslikler = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    return derslikler.filter((s) => {
      const matchesArama = !q || String(s?.ad ?? '').toLocaleLowerCase('tr-TR').includes(q);
      const matchesTip = !filterTip || String(s?.tip ?? '') === String(filterTip);
      const matchesAktif =
        !filterAktif ||
        (String(filterAktif) === 'true' ? Boolean(s?.aktif) : !Boolean(s?.aktif));
      const matchesKat = !filterKat || String(s?.kat ?? '') === String(filterKat);
      return matchesArama && matchesTip && matchesAktif && matchesKat;
    });
  }, [derslikler, arama, filterTip, filterAktif, filterKat]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Derslik Yönetimi</h1>
        <p className="text-gray-500">Sistemde tanımlı (sabit) derslikleri görüntüleyin ve filtreleyin.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <List className="text-gray-500 w-5 h-5 mr-2" />
              <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Derslikler</h2>
            </div>
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Görünen: {filtreliDerslikler.length} / {derslikler.length}
            </span>
          </div>

          <div className="px-6 py-4 border-b bg-white">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Arama</label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg border bg-indigo-50 text-indigo-700 font-semibold flex items-center">
                    <Building className="w-4 h-4 mr-2" /> Salon
                  </div>
                  <input
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    placeholder="Salon adı/no (örn: 205, 409...)"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tip</label>
                  <select
                    value={filterTip}
                    onChange={(e) => setFilterTip(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    <option value="Küçük Sınıf">Küçük Sınıf</option>
                    <option value="Orta Büyüklükteki Sınıf">Orta Büyüklükteki Sınıf</option>
                    <option value="Büyük Sınıf">Büyük Sınıf</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kat</label>
                  <select
                    value={filterKat}
                    onChange={(e) => setFilterKat(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    {[1, 2, 3, 4].map((k) => (
                      <option key={k} value={k}>
                        {k}. Kat
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Durum</label>
                  <select
                    value={filterAktif}
                    onChange={(e) => setFilterAktif(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none bg-white"
                  >
                    <option value="">Tümü</option>
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
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
                <div className="px-3 py-2 rounded-lg border bg-indigo-50 text-indigo-700 font-semibold flex items-center">
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
                    <th className="p-4 font-semibold">Salon Adı</th>
                    <th className="p-4 font-semibold text-center">Tipi</th>
                    <th className="p-4 font-semibold text-center">Kat</th>
                    <th className="p-4 font-semibold text-center">Kapasite</th>
                    <th className="p-4 font-semibold text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtreliDerslikler.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-500">Henüz derslik eklenmemiş.</td></tr>
                  ) : (
                    filtreliDerslikler.map((salon, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-indigo-600">{salon.ad}</td>
                        <td className="p-4 text-center font-medium">{salon.tip}</td>
                        <td className="p-4 text-center">{salon.kat}. Kat</td>
                        <td className="p-4 text-center font-bold text-gray-700">{salon.kapasite}</td>
                        <td className="p-4 text-center flex justify-center">
                          {salon.aktif ? (
                            <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-md font-semibold text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Aktif</span>
                          ) : (
                            <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md font-semibold text-xs"><XCircle className="w-3 h-3 mr-1" /> Pasif</span>
                          )}
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

export default DerslikYonetimi;
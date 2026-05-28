import { useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Clock, List, Loader2, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const OturumYonetimi = () => {
  const [oturumlar, setOturumlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');

  // ESLint Hatasını Çözen Yapı: useCallback
  const oturumlariGetir = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/oturumlar/liste');
      setOturumlar(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Oturumlar yüklenirken bağlantı hatası!');
    } finally {
      setLoading(false);
    }
  }, []);

  // Güvenli useEffect kullanımı
  useEffect(() => {
    let mounted = true;
    const fetchVeri = async () => {
      if (mounted) await oturumlariGetir();
    };
    fetchVeri();
    return () => { mounted = false; };
  }, [oturumlariGetir]);

  const temizle = () => setArama('');

  const filtreliOturumlar = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    return oturumlar.filter((o) => {
      if (!q) return true;
      return String(o?.tanim ?? '').toLocaleLowerCase('tr-TR').includes(q);
    });
  }, [oturumlar, arama]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Oturum Yönetimi</h1>
        <p className="text-gray-500">Sistemde tanımlı (sabit) oturumları görüntüleyin ve filtreleyin.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <List className="text-gray-500 w-5 h-5 mr-2" />
            <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Oturumlar</h2>
          </div>
          <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            Görünen: {filtreliOturumlar.length} / {oturumlar.length}
          </span>
        </div>

        <div className="px-6 py-4 border-b bg-white">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Arama</label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-lg border bg-purple-50 text-purple-700 font-semibold flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> Oturum
                </div>
                <input
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  placeholder="Tanim (örn: Sabah-1, Öğle...)"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
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
              <div className="px-3 py-2 rounded-lg border bg-purple-50 text-purple-700 font-semibold flex items-center">
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
                  <th className="p-4 font-semibold">Oturum ID</th>
                  <th className="p-4 font-semibold">Tanım</th>
                  <th className="p-4 font-semibold">Başlangıç Saati</th>
                  <th className="p-4 font-semibold">Bitiş Saati</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtreliOturumlar.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtreliOturumlar.map((oturum, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-500">#{oturum.oturumId}</td>
                      <td className="p-4 font-bold text-purple-600">{oturum.tanim}</td>
                      <td className="p-4 font-medium">{oturum.baslangicSaat}</td>
                      <td className="p-4 font-medium">{oturum.bitisSaat}</td>
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

export default OturumYonetimi;
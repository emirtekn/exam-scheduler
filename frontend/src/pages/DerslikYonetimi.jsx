import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Save, List, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DerslikYonetimi = () => {
  const [ad, setAd] = useState('');
  const [kapasite, setKapasite] = useState('');
  const [tip, setTip] = useState('Sınıf');
  const [kat, setKat] = useState('1');
  const [aktif, setAktif] = useState(true);

  const [derslikler, setDerslikler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

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
    // Sadece set-state kuralını susturuyoruz
    // eslint-disable-next-line react-hooks/set-state-in-effect
    derslikleriGetir();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ad || !kapasite) {
      toast.error('Lütfen Ad ve Kapasite alanlarını doldurun!');
      return;
    }

    setKaydediliyor(true);
    const toastId = toast.loading('Derslik kaydediliyor...');

    try {
      await axios.post('http://localhost:8080/api/derslikler/ekle', {
        ad: ad,
        kapasite: parseInt(kapasite),
        tip: tip,
        kat: parseInt(kat),
        aktif: aktif
      });

      toast.success(`${ad} başarıyla eklendi!`, { id: toastId });
      
      setAd('');
      setKapasite('');
      setTip('Sınıf');
      setKat('1');
      setAktif(true);
      
      derslikleriGetir();

    } catch (error) {
      console.error("Hata:", error);
      toast.error('Derslik kaydedilirken hata oluştu!', { id: toastId });
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Derslik Yönetimi</h1>
        <p className="text-gray-500">Fakültedeki amfi, sınıf ve laboratuvarları kapasiteleriyle tanımlayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-1 h-fit">
          <div className="bg-indigo-600 px-6 py-4 flex items-center">
            <Building className="text-white w-5 h-5 mr-2" />
            <h2 className="text-white font-semibold text-lg">Yeni Derslik Ekle</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Derslik Adı</label>
              <input type="text" placeholder="Örn: Amfi-1, Z-04" value={ad} onChange={(e) => setAd(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kapasite</label>
                <input type="number" placeholder="Örn: 80" min="1" value={kapasite} onChange={(e) => setKapasite(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kat</label>
                <select value={kat} onChange={(e) => setKat(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="0">Zemin Kat (0)</option>
                  <option value="1">1. Kat</option>
                  <option value="2">2. Kat</option>
                  <option value="3">3. Kat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipi</label>
              <select value={tip} onChange={(e) => setTip(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="Sınıf">Normal Sınıf</option>
                <option value="Amfi">Amfi</option>
                <option value="Laboratuvar">Laboratuvar</option>
              </select>
            </div>

            <div className="flex items-center mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="aktifMi" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer" />
              <label htmlFor="aktifMi" className="ml-3 text-sm font-semibold text-gray-700 cursor-pointer select-none">Bu salon sınavlarda kullanıma uygun mu? (Aktif)</label>
            </div>

            <button type="submit" disabled={kaydediliyor} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center transition-colors mt-4">
              {kaydediliyor ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Dersliği Kaydet</>}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <List className="text-gray-500 w-5 h-5 mr-2" />
              <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Derslikler</h2>
            </div>
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Toplam: {derslikler.length}</span>
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
                  {derslikler.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-500">Henüz derslik eklenmemiş.</td></tr>
                  ) : (
                    derslikler.map((salon, index) => (
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
    </div>
  );
};

export default DerslikYonetimi;
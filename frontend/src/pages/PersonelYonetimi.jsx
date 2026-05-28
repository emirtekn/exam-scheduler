import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Save, List, Loader2 } from 'lucide-react';
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
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [unvan, setUnvan] = useState('Prof. Dr.');
  const [bolumId, setBolumId] = useState('1'); // Varsayılan: Yazılım

  const [personeller, setPersoneller] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ad || !soyad) {
      toast.error('Lütfen Ad ve Soyad alanlarını doldurun!');
      return;
    }

    setKaydediliyor(true);
    const toastId = toast.loading('Personel kaydediliyor...');

    try {
      await axios.post('http://localhost:8080/api/personeller/ekle', {
        ad: ad,
        soyad: soyad,
        unvan: unvan,
        bolumId: parseInt(bolumId)
      });

      toast.success(`${unvan} ${ad} ${soyad} başarıyla eklendi!`, { id: toastId });
      
      // Formu temizle
      setAd('');
      setSoyad('');
      setUnvan('Prof. Dr.');
      setBolumId('1');
      
      // Tabloyu güncelle
      personelleriGetir();

    } catch (error) {
      console.error("Hata:", error);
      toast.error('Personel kaydedilirken hata oluştu!', { id: toastId });
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h1>
        <p className="text-gray-500">Fakültedeki akademisyenleri ve gözetmenleri sisteme tanımlayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL TARAF: FORM */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-1 h-fit">
          <div className="bg-emerald-600 px-6 py-4 flex items-center">
            <Users className="text-white w-5 h-5 mr-2" />
            <h2 className="text-white font-semibold text-lg">Yeni Personel Ekle</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ünvan</label>
              <select 
                value={unvan} onChange={(e) => setUnvan(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Prof. Dr.">Prof. Dr.</option>
                <option value="Doç. Dr.">Doç. Dr.</option>
                <option value="Dr. Öğr. Üyesi">Dr. Öğr. Üyesi</option>
                <option value="Öğr. Gör. Dr.">Öğr. Gör. Dr.</option>
                <option value="Öğr. Gör.">Öğr. Gör.</option>
                <option value="Arş. Gör. Dr.">Arş. Gör. Dr.</option>
                <option value="Arş. Gör.">Arş. Gör.</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ad</label>
              <input 
                type="text" placeholder="Örn: Fatih" 
                value={ad} onChange={(e) => setAd(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Soyad</label>
              <input 
                type="text" placeholder="Örn: YÜCALAR" 
                value={soyad} onChange={(e) => setSoyad(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Bölüm</label>
              <select 
                value={bolumId} onChange={(e) => setBolumId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {/* Sözlüğü döngüye sokup açılır listeyi (dropdown) basıyoruz */}
                {Object.entries(bolumSözlüğü).map(([id, isim]) => (
                  <option key={id} value={id}>{isim}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={kaydediliyor} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center transition-colors mt-4">
              {kaydediliyor ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Personeli Kaydet</>}
            </button>
          </form>
        </div>

        {/* SAĞ TARAF: TABLO */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <List className="text-gray-500 w-5 h-5 mr-2" />
              <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Personeller</h2>
            </div>
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Toplam: {personeller.length}
            </span>
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
                  {personeller.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-6 text-center text-gray-500">Henüz personel eklenmemiş.</td>
                    </tr>
                  ) : (
                    personeller.map((personel, index) => (
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
    </div>
  );
};

export default PersonelYonetimi;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Save, List, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DersYonetimi = () => {
  // --- STATE TANIMLAMALARI ---
  const [dersKodu, setDersKodu] = useState('');
  const [dersAdi, setDersAdi] = useState('');
  const [dersTuru, setDersTuru] = useState('Zorunlu');
  const [ogrenciSayisi, setOgrenciSayisi] = useState(''); // Artık serbest sayı değil, dropdown!
  const [yariyil, setYariyil] = useState('1');
  const [bolumId, setBolumId] = useState('1'); // Veritabanındaki yeni 5 bölüme göre

  const [dersler, setDersler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

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

  // --- FORM GÖNDERİMİ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dersKodu || !dersAdi || !ogrenciSayisi) {
      toast.error('Lütfen tüm alanları (Özellikle Kapasite) doldurun!');
      return;
    }

    setKaydediliyor(true);
    const toastId = toast.loading('Ders kaydediliyor...');

    try {
      await axios.post('http://localhost:8080/api/dersler/ekle', {
        dersKodu: dersKodu,
        dersAdi: dersAdi,
        dersTuru: dersTuru,
        ogrenciSayisi: parseInt(ogrenciSayisi),
        yariyil: parseInt(yariyil),
        bolumId: parseInt(bolumId)
      });

      toast.success(`${dersKodu} kodlu ders başarıyla eklendi!`, { id: toastId });
      
      // Formu temizle
      setDersKodu('');
      setDersAdi('');
      setOgrenciSayisi('');
      setDersTuru('Zorunlu');
      setYariyil('1');
      setBolumId('1');
      
      // Tabloyu güncelle
      dersleriGetir();

    } catch (error) {
      console.error("Ders kaydedilirken hata:", error);
      toast.error('Ders kaydedilirken hata oluştu!', { id: toastId });
    } finally {
      setKaydediliyor(false);
    }
  };

  // --- ARAYÜZ (RENDER) ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ders Yönetimi</h1>
        <p className="text-gray-500">Fakültedeki dersleri, hocanın kapasite kurallarına göre tanımlayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL TARAF: FORM */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-1 h-fit">
          <div className="bg-blue-600 px-6 py-4 flex items-center">
            <BookOpen className="text-white w-5 h-5 mr-2" />
            <h2 className="text-white font-semibold text-lg">Yeni Ders Ekle</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ders Kodu</label>
              <input 
                type="text" placeholder="Örn: YZM 2126" 
                value={dersKodu} onChange={(e) => setDersKodu(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ders Adı</label>
              <input 
                type="text" placeholder="Örn: Veritabanı Sistemleri" 
                value={dersAdi} onChange={(e) => setDersAdi(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* KONTENJAN ARTIK SABİT AÇILIR LİSTE (HOCANIN KURALI) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kontenjan (Kural)</label>
                <select 
                  value={ogrenciSayisi} onChange={(e) => setOgrenciSayisi(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Seçiniz --</option>
                  <option value="50">50 Kişi (311 Nolu Sınıf)</option>
                  <option value="60">60 Kişi (Küçük Sınıflar)</option>
                  <option value="80">80 Kişi (309 Nolu Sınıf)</option>
                  <option value="150">150 Kişi (Büyük Sınıflar)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yarıyıl</label>
                <select 
                  value={yariyil} onChange={(e) => setYariyil(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num}. Yarıyıl</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tür</label>
                <select 
                  value={dersTuru} onChange={(e) => setDersTuru(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Zorunlu">Zorunlu</option>
                  <option value="Seçmeli">Seçmeli</option>
                </select>
              </div>
              
              {/* BÖLÜM ID'LERİ VERİTABANINDAKİ YENİ 5 BÖLÜME GÖRE GÜNCELLENDİ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bölüm</label>
                <select 
                  value={bolumId} onChange={(e) => setBolumId(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="1">Yazılım Mühendisliği</option>
                  <option value="2">Elektrik Mühendisliği</option>
                  <option value="3">Makine Mühendisliği</option>
                  <option value="4">Mekatronik Mühendisliği</option>
                  <option value="5">Enerji Sistemleri</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={kaydediliyor} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center transition-colors mt-4">
              {kaydediliyor ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Dersi Kaydet</>}
            </button>
          </form>
        </div>

        {/* SAĞ TARAF: TABLO */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <List className="text-gray-500 w-5 h-5 mr-2" />
              <h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Dersler</h2>
            </div>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Toplam: {dersler.length}
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
                    <th className="p-4 font-semibold">Kodu</th>
                    <th className="p-4 font-semibold">Ders Adı</th>
                    <th className="p-4 font-semibold text-center">Yarıyıl</th>
                    <th className="p-4 font-semibold text-center">Tür</th>
                    <th className="p-4 font-semibold text-center">Öğrenci Sayısı</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {dersler.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500">Henüz ders eklenmemiş. Lütfen sol taraftan ekleyin.</td>
                    </tr>
                  ) : (
                    dersler.map((ders, index) => (
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
    </div>
  );
};

export default DersYonetimi;
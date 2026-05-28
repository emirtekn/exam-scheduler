import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Clock, Save, List, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const oturumKatalogu = {
  "Sabah-1": { baslangic: "09:00", bitis: "10:00" },
  "Sabah-2": { baslangic: "10:30", bitis: "11:30" },
  "Öğle": { baslangic: "12:00", bitis: "13:00" },
  "Öğleden Sonra-1": { baslangic: "13:45", bitis: "14:45" },
  "Öğleden Sonra-2": { baslangic: "15:15", bitis: "16:30" }
};

const OturumYonetimi = () => {
  const [seciliTanim, setSeciliTanim] = useState('');
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');

  const [oturumlar, setOturumlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

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

  const handleTanimChange = (e) => {
    const secilen = e.target.value;
    setSeciliTanim(secilen);

    if (secilen && oturumKatalogu[secilen]) {
      setBaslangic(oturumKatalogu[secilen].baslangic);
      setBitis(oturumKatalogu[secilen].bitis);
    } else {
      setBaslangic('');
      setBitis('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seciliTanim) return toast.error('Lütfen bir Oturum Tanımı seçin!');

    const zatenVarMi = oturumlar.some(o => o.tanim === seciliTanim);
    if (zatenVarMi) return toast.error('Bu oturum zaten sisteme eklenmiş!');

    setKaydediliyor(true);
    const toastId = toast.loading('Oturum kaydediliyor...');

    try {
      await axios.post('http://localhost:8080/api/oturumlar/ekle', {
        tanim: seciliTanim,
        baslangicSaat: baslangic,
        bitisSaat: bitis
      });
      toast.success(`${seciliTanim} oturumu başarıyla eklendi!`, { id: toastId });
      setSeciliTanim(''); setBaslangic(''); setBitis('');
      await oturumlariGetir();
    } catch (error) {
      console.error(error);
      toast.error('Oturum kaydedilirken hata oluştu!', { id: toastId });
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Oturum Yönetimi</h1>
        <p className="text-gray-500">Sınav saatlerini ve oturum periyotlarını sisteme tanımlayın.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-1 h-fit">
          <div className="bg-purple-600 px-6 py-4 flex items-center">
            <Clock className="text-white w-5 h-5 mr-2" />
            <h2 className="text-white font-semibold text-lg">Yeni Oturum Tanımla</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Oturum Tanımı</label>
              <select value={seciliTanim} onChange={handleTanimChange} className="w-full border rounded-lg px-4 py-2 outline-none bg-white">
                <option value="">-- Oturum Seçiniz --</option>
                {Object.keys(oturumKatalogu).map(tanim => <option key={tanim} value={tanim}>{tanim}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Başlangıç</label>
                <input type="time" value={baslangic} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bitiş</label>
                <input type="time" value={bitis} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600 font-bold" />
              </div>
            </div>
            <button type="submit" disabled={kaydediliyor || !seciliTanim} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center mt-4 disabled:bg-purple-400">
              {kaydediliyor ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Oturumu Kaydet</>}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center"><List className="text-gray-500 w-5 h-5 mr-2" /><h2 className="text-gray-700 font-semibold text-lg">Sistemdeki Oturumlar</h2></div>
            <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Toplam: {oturumlar.length}</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? <div className="p-8 flex justify-center items-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Veriler yükleniyor...</div> : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-semibold">Oturum ID</th><th className="p-4 font-semibold">Tanım</th><th className="p-4 font-semibold">Başlangıç Saati</th><th className="p-4 font-semibold">Bitiş Saati</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {oturumlar.length === 0 ? <tr><td colSpan="4" className="p-6 text-center text-gray-500">Henüz oturum tanımlanmamış.</td></tr> : (
                    oturumlar.map((oturum, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-gray-500">#{oturum.oturumId}</td><td className="p-4 font-bold text-purple-600">{oturum.tanim}</td><td className="p-4 font-medium">{oturum.baslangicSaat}</td><td className="p-4 font-medium">{oturum.bitisSaat}</td>
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

export default OturumYonetimi;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, PlusCircle, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

const OturumYonetimi = () => {
  const [oturumlar, setOturumlar] = useState([]);
  const [tanim, setTanim] = useState('');
  const [baslangicSaat, setBaslangicSaat] = useState('');
  const [bitisSaat, setBitisSaat] = useState('');
  const [loading, setLoading] = useState(false);

  const verileriGetir = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/oturumlar/liste');
      setOturumlar(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Oturumlar yüklenirken hata oluştu!');
    }
  };

 useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verileriGetir();
  }, []);

  const handleKaydet = async (e) => {
    e.preventDefault();
    if (!tanim || !baslangicSaat || !bitisSaat) {
      toast.error('Lütfen tüm alanları doldurun!');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Oturum kaydediliyor...');

    try {
      await axios.post('http://localhost:8080/api/oturumlar/ekle', {
        tanim: tanim,
        baslangicSaat: baslangicSaat + ':00', // SQL Time formatı için saniye ekliyoruz
        bitisSaat: bitisSaat + ':00'
      });

      toast.success('Oturum sisteme eklendi!', { id: toastId });
      setTanim('');
      setBaslangicSaat('');
      setBitisSaat('');
      verileriGetir(); // Tabloyu güncelle
    } catch (error) {
      toast.error('Kaydedilirken hata oluştu.', { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Oturum Yönetimi</h1>
        <p className="text-gray-500">Sınav saatlerini ve oturum periyotlarını sisteme tanımlayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL TARAF: FORM */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6 text-purple-600">
            <PlusCircle className="w-6 h-6 mr-2" />
            <h2 className="font-semibold text-lg text-gray-800">Yeni Oturum Tanımla</h2>
          </div>

          <form onSubmit={handleKaydet} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Oturum Tanımı</label>
              <input 
                type="text" 
                placeholder="Örn: Sabah, Öğle-1, Akşam" 
                value={tanim}
                onChange={(e) => setTanim(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Başlangıç</label>
                <input 
                  type="time" 
                  value={baslangicSaat}
                  onChange={(e) => setBaslangicSaat(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bitiş</label>
                <input 
                  type="time" 
                  value={bitisSaat}
                  onChange={(e) => setBitisSaat(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors flex justify-center items-center"
            >
              <CalendarClock className="w-5 h-5 mr-2" /> Oturumu Kaydet
            </button>
          </form>
        </div>

        {/* SAĞ TARAF: LİSTE */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6 text-gray-600">
            <Clock className="w-6 h-6 mr-2" />
            <h2 className="font-semibold text-lg text-gray-800">Sistemdeki Oturumlar</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 text-gray-600">
                  <th className="pb-3 font-semibold">Oturum ID</th>
                  <th className="pb-3 font-semibold">Tanım</th>
                  <th className="pb-3 font-semibold">Başlangıç Saati</th>
                  <th className="pb-3 font-semibold">Bitiş Saati</th>
                </tr>
              </thead>
              <tbody>
                {oturumlar.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400 italic">Henüz oturum tanımlanmamış.</td>
                  </tr>
                ) : (
                  oturumlar.map((o) => (
                    <tr key={o.oturumId} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-500">#{o.oturumId}</td>
                      <td className="py-3 font-bold text-purple-700">{o.tanim}</td>
                      <td className="py-3 text-gray-700">{String(o.baslangicSaat).substring(0, 5)}</td>
                      <td className="py-3 text-gray-700">{String(o.bitisSaat).substring(0, 5)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OturumYonetimi;
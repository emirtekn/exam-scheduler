import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, UserX, Save, Loader2 } from 'lucide-react'; // 'List' i sildik
import toast from 'react-hot-toast';

const MazeretYonetimi = () => {
  const [personelId, setPersonelId] = useState('');
  const [tarih, setTarih] = useState('');
  const [mazeretTuru, setMazeretTuru] = useState('Raporlu');

  const [personeller, setPersoneller] = useState([]);
  const [durumlar, setDurumlar] = useState([]);
  const [loading, setLoading] = useState(true); // Artık aşağıda kullanıyoruz
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const verileriGetir = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        axios.get('http://localhost:8080/api/personeller/liste'),
        axios.get('http://localhost:8080/api/durumlar/liste')
      ]);
      setPersoneller(pRes.data);
      setDurumlar(dRes.data);
    } catch (error) {
      console.error("Veri çekme hatası:", error); // Error hatası 1 çözüldü
      toast.error('Veriler yüklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verileriGetir();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personelId || !tarih) {
      toast.error('Lütfen personel ve tarih seçin!');
      return;
    }

    setKaydediliyor(true);
    try {
      await axios.post('http://localhost:8080/api/durumlar/ekle', {
        personelId: parseInt(personelId),
        tarih: tarih,
        mazeretTuru: mazeretTuru
      });
      toast.success('Mazeret kaydedildi!');
      
      // Formu temizle
      setPersonelId('');
      setTarih('');
      setMazeretTuru('Raporlu');
      
      verileriGetir();
    } catch (error) {
      console.error("Kayıt hatası:", error); // Error hatası 2 çözüldü
      toast.error('Kayıt hatası!');
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Personel Mazeret Yönetimi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 h-fit">
          <div className="flex items-center mb-4 text-red-600">
            <UserX className="w-5 h-5 mr-2" />
            <h2 className="font-semibold text-lg">Mazeret Tanımla</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Personel Seçin</label>
              <select value={personelId} onChange={(e) => setPersonelId(e.target.value)} className="w-full border rounded-lg px-4 py-2 bg-white">
                <option value="">Seçiniz...</option>
                {personeller.map(p => (
                  <option key={p.personelId} value={p.personelId}>{p.unvan} {p.ad} {p.soyad}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Tarih</label>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className="w-full border rounded-lg px-4 py-2" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Mazeret Türü</label>
              <select value={mazeretTuru} onChange={(e) => setMazeretTuru(e.target.value)} className="w-full border rounded-lg px-4 py-2 bg-white">
                <option value="Raporlu">Raporlu</option>
                <option value="Görevli">Görevli</option>
                <option value="İzinli">İzinli</option>
              </select>
            </div>

            <button type="submit" disabled={kaydediliyor} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center">
              {kaydediliyor ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Mazereti İşle</>}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border lg:col-span-2 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-gray-500" />
            <h2 className="font-semibold text-gray-700 text-lg">Güncel Mazeret Listesi</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            {/* loading state'ini burada kullanarak hatayı çözdük */}
            {loading ? (
              <div className="flex justify-center items-center p-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Veriler yükleniyor...
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-gray-600 text-sm">
                    <th className="p-3">Hoca ID</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Mazeret</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {durumlar.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-gray-500">Henüz mazeret girilmemiş.</td></tr>
                  ) : (
                    durumlar.map((d, index) => {
                      const ilgiliPersonel = personeller.find(p => p.personelId === d.personelId);
                      return (
                        <tr key={index} className="border-b hover:bg-red-50">
                          <td className="p-3 font-bold text-gray-700">
                            {ilgiliPersonel ? `${ilgiliPersonel.unvan} ${ilgiliPersonel.ad} ${ilgiliPersonel.soyad}` : `Personel #${d.personelId}`}
                          </td>
                          <td className="p-3 font-medium">{new Date(d.tarih).toLocaleDateString('tr-TR')}</td>
                          <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">{d.mazeretTuru}</span></td>
                        </tr>
                      );
                    })
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

export default MazeretYonetimi;
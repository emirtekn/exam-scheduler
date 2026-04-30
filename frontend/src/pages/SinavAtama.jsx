import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarPlus, Loader2, BookOpen, Clock, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

const SinavAtama = () => {
  const [secilenDersId, setSecilenDersId] = useState('');
  const [secilenTarih, setSecilenTarih] = useState('');
  const [secilenOturumId, setSecilenOturumId] = useState('');

  const [dersler, setDersler] = useState([]);
  const [oturumlar, setOturumlar] = useState([]);
  const [sinavlar, setSinavlar] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const verileriGetir = async () => {
    try {
      const [dersRes, oturumRes, sinavRes] = await Promise.all([
        axios.get('http://localhost:8080/api/dersler/liste'),
        axios.get('http://localhost:8080/api/oturumlar/liste'),
        axios.get('http://localhost:8080/api/sinavlar/liste')
      ]);
      setDersler(dersRes.data);
      setOturumlar(oturumRes.data);
      setSinavlar(sinavRes.data);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      toast.error('Veriler yüklenirken backend bağlantı hatası!');
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verileriGetir();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!secilenDersId || !secilenTarih || !secilenOturumId) {
      toast.error('Lütfen Ders, Tarih ve Oturum alanlarını eksiksiz doldurun!');
      return;
    }

    setKaydediliyor(true);
    const toastId = toast.loading('Sınav tanımlanıyor...');

    try {
      await axios.post('http://localhost:8080/api/sinavlar/ekle', {
        dersId: parseInt(secilenDersId),
        tarih: secilenTarih,
        oturumId: parseInt(secilenOturumId)
      });

      toast.success('Sınav tanımlandı!', { id: toastId });
      verileriGetir(); 

    } catch (error) {
      // İŞTE O SİNSİ 400 HATASININ GERÇEK SEBEBİNİ BURADA GÖRECEĞİZ:
      const asilHata = error.response?.data || error.message;
      console.error("Kayıt hatası Detayı:", asilHata);
      toast.error(`Hata: ${asilHata}`, { id: toastId, duration: 6000 });
    } finally {
      setKaydediliyor(false);
    }
  }; // MUHTEMELEN SENİN SİLİNEN PARANTEZ BURASIYDI DAYI :)

  if (loadingPage) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-blue-600" /> Veriler yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Sınav Planlama Dashboard</h1>
        <p className="text-gray-500">Sınavları tanımlayın, salon ve gözetmen ataması gerçekleştirin.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex items-center">
          <CalendarPlus className="text-white w-6 h-6 mr-3" />
          <h2 className="text-white font-semibold text-lg">Yeni Sınav Planla</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-1 text-blue-500" /> Ders Kodu
            </label>
            <select value={secilenDersId} onChange={(e) => setSecilenDersId(e.target.value)} className="w-full border rounded-lg px-4 py-2.5 outline-none bg-white text-sm">
              <option value="">Örn: YZM 2126</option>
              {dersler.map(ders => (
                <option key={ders.dersId} value={ders.dersId}>{ders.dersKodu} - {ders.dersAdi}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <CalendarDays className="w-4 h-4 mr-1 text-blue-500" /> Tarih
            </label>
            <input type="date" value={secilenTarih} onChange={(e) => setSecilenTarih(e.target.value)} className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-1 text-blue-500" /> Oturum
            </label>
            <select value={secilenOturumId} onChange={(e) => setSecilenOturumId(e.target.value)} className="w-full border rounded-lg px-4 py-2.5 outline-none bg-white text-sm">
              <option value="">-- Oturum Seçiniz --</option>
              {oturumlar.map(oturum => (
                <option key={oturum.oturumId} value={oturum.oturumId}>{oturum.tanim} ({oturum.baslangicSaat})</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={kaydediliyor} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg flex justify-center items-center shadow">
            {kaydediliyor ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CalendarPlus className="w-5 h-5 mr-2" /> Sınav Ata</>}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 border">
        <h2 className="font-semibold text-lg mb-3">Tanımlanmış Sınavlar (Kontrol)</h2>
        <ul className="text-sm space-y-1">
          {sinavlar.map((s, index) => (
            <li key={index}>Sınav #{s.sinavId}: {s.ders?.dersAdi} | {s.tarih}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SinavAtama;
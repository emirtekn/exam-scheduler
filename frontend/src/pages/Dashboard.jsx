import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Loader2, Calendar, Edit3, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [derslikler, setDerslikler] = useState([]);
  const [oturumlar, setOturumlar] = useState([]);
  const [sinavlar, setSinavlar] = useState([]); 
  const [personeller, setPersoneller] = useState([]);
  const [atamalar, setAtamalar] = useState([]); 

  const [loading, setLoading] = useState(true);

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seciliHucre, setSeciliHucre] = useState(null);
  const [seciliSinavId, setSeciliSinavId] = useState('');
  const [seciliPersonelId, setSeciliPersonelId] = useState('');

  const verileriGetir = async () => {
    try {
      const [dRes, oRes, sRes, pRes, atamaRes] = await Promise.all([
        axios.get('http://localhost:8080/api/derslikler/liste'),
        axios.get('http://localhost:8080/api/oturumlar/liste'),
        axios.get('http://localhost:8080/api/sinavlar/liste'),
        axios.get('http://localhost:8080/api/personeller/liste'),
        axios.get('http://localhost:8080/api/atamalar/liste')
      ]);
      setDerslikler(dRes.data); 
      setOturumlar(oRes.data);
      setSinavlar(sRes.data);
      setPersoneller(pRes.data);
      
      // TARİH FORMATI KRİZİNİ BURADA ÇÖZÜYORUZ (T saatini atıp sadece tarihi alıyoruz)
      const formatliAtamalar = atamaRes.data.map(row => ({
        tarih: String(row.tarih || row.TARIH).split('T')[0], 
        oturum: { oturumId: row.oturumId || row.OTURUMID },
        derslik: { derslikId: row.derslikId || row.DERSLIKID },
        ders: { dersAdi: row.dersAdi || row.DERSADI },
        personel: { 
            personelId: row.personelId || row.PERSONELID, 
            unvan: row.unvan || row.UNVAN, 
            soyad: row.soyad || row.SOYAD 
        }
      }));
      setAtamalar(formatliAtamalar); 

    } catch (err) {
      console.error(err);
      toast.error("Veriler çekilirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verileriGetir();
  }, []);

  const tarihler = [...new Set(sinavlar.map(s => String(s.tarih).split('T')[0]))].sort();

  const hucreTikla = (tarih, oturum, derslik) => {
    setSeciliHucre({ tarih, oturum, derslik });
    setSeciliSinavId('');
    setSeciliPersonelId('');
    setIsModalOpen(true);
  };

  // İŞTE BÜYÜK FİNAL! DÜĞMEYE BASINCA VERİTABANINA YAZIYORUZ!
  const handleAtamaKaydet = async () => {
    if (!seciliSinavId || !seciliPersonelId) {
      toast.error("Lütfen Ders ve Gözetmen seçin!");
      return;
    }

    const hocaCakisiyorMu = atamalar.find(a => 
      a.tarih === seciliHucre.tarih && 
      a.oturum.oturumId === seciliHucre.oturum.oturumId && 
      a.personel.personelId === parseInt(seciliPersonelId)
    );

    if (hocaCakisiyorMu) {
      toast.error(`DİKKAT: Seçtiğiniz gözetmen o saatte ${hocaCakisiyorMu.derslik.ad} salonunda görevli!`, { icon: '⚠️', duration: 5000 });
      return;
    }

    const toastId = toast.loading('SQL Veritabanına İşleniyor...');
    try {
      await axios.post('http://localhost:8080/api/atamalar/manuel-kaydet', {
        sinavId: seciliSinavId,
        derslikId: seciliHucre.derslik.derslikId,
        personelId: seciliPersonelId
      });
      
      toast.success("Atama başarıyla kaydedildi!", { id: toastId });
      setIsModalOpen(false);
      verileriGetir(); // Veritabanından yeni halini çek ve hücreyi YEŞİLE boya!
    } catch (error) {
      toast.error("Kaydedilirken hata oluştu!", { id: toastId });
      console.error(error);
    }
  };

  if (loading) return <div className="p-10 flex justify-center text-blue-600"><Loader2 className="animate-spin w-8 h-8 mr-2" /> Program İskeleti Kuruluyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <LayoutDashboard className="mr-2 text-blue-600" /> İnteraktif Sınav Takvimi
        </h1>
        <div className="text-sm bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-semibold border border-emerald-200">
          {tarihler.length} Farklı Gün Planlandı
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto pb-6">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="border-r p-4 text-sm font-bold text-gray-700 w-48 bg-gray-200">Oturum / Derslik</th>
              {tarihler.length === 0 ? (
                <th className="p-4 text-gray-500 italic">Henüz sınav tanımlanmamış...</th>
              ) : (
                tarihler.map(tarih => (
                  <th key={tarih} className="border-r p-4 text-center min-w-[220px]">
                    <div className="flex flex-col items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-blue-800 font-extrabold">{new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year:'numeric' })}</span>
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {oturumlar.map(oturum => (
              <React.Fragment key={oturum.oturumId}>
                <tr className="bg-blue-600 text-white">
                  <td colSpan={tarihler.length + 1} className="p-2 font-bold text-center uppercase tracking-widest text-sm shadow-inner">
                    {oturum.tanim} OTURUMU ({oturum.baslangicSaat})
                  </td>
                </tr>
                
                {derslikler.map(derslik => (
                  <tr key={oturum.oturumId + derslik.derslikId} className="hover:bg-gray-50 transition-colors border-b">
                    <td className="border-r p-3 font-bold text-gray-800 bg-gray-50 text-center">
                      {derslik.ad} <br/> <span className="text-xs font-normal text-gray-500">(Kap: {derslik.kapasite})</span>
                    </td>
                    
                    {tarihler.map(tarih => {
                      const hucre = atamalar.find(a => a.tarih === tarih && a.oturum.oturumId === oturum.oturumId && a.derslik.derslikId === derslik.derslikId);
                      
                      return (
                        <td key={tarih + oturum.oturumId + derslik.derslikId} className="border-r p-2 h-24 relative group cursor-pointer" onClick={() => hucreTikla(tarih, oturum, derslik)}>
                          {hucre ? (
                            <div className="flex flex-col h-full justify-between bg-emerald-50 rounded p-2 border border-emerald-200 shadow-sm">
                              <span className="text-xs font-bold text-emerald-800">{hucre.ders.dersAdi}</span>
                              <span className="text-sm font-semibold text-emerald-600 border-t border-emerald-200 pt-1 mt-1">👤 {hucre.personel.unvan} {hucre.personel.soyad}</span>
                            </div>
                          ) : (
                            <div className="h-full w-full bg-gray-50/50 rounded border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-500 transition-all">
                              <Edit3 className="w-5 h-5 mb-1 opacity-50 group-hover:opacity-100" />
                              <span className="text-xs font-semibold">Atama Yap</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Manuel Atama / Düzenleme</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-red-200 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg flex items-start text-sm text-blue-800 font-medium">
                <AlertTriangle className="w-5 h-5 mr-2 shrink-0 text-blue-600" />
                <div>
                  <strong>{new Date(seciliHucre.tarih).toLocaleDateString('tr-TR')}</strong> günü, <br/>
                  <strong>{seciliHucre.oturum.tanim}</strong> oturumu için <br/>
                  <strong>{seciliHucre.derslik.ad}</strong> salonuna atama yapıyorsunuz.
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ders Seçin</label>
                <select value={seciliSinavId} onChange={e => setSeciliSinavId(e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                  <option value="">-- Ders / Sınav Seçiniz --</option>
                  {sinavlar.filter(s => String(s.tarih).split('T')[0] === seciliHucre.tarih && s.oturum?.oturumId === seciliHucre.oturum.oturumId).map(s => (
                    <option key={s.sinavId} value={s.sinavId}>{s.ders?.dersAdi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gözetmen Seçin</label>
                <select value={seciliPersonelId} onChange={e => setSeciliPersonelId(e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                  <option value="">-- Hoca Seçiniz --</option>
                  {personeller.map(p => (
                    <option key={p.personelId} value={p.personelId}>{p.unvan} {p.ad} {p.soyad}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleAtamaKaydet} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
                Atamayı Kaydet & Çakışmayı Denetle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
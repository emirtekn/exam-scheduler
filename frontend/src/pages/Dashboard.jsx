import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LayoutDashboard, Loader2, Edit3, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [derslikler, setDerslikler] = useState([]);
  const [oturumlar, setOturumlar] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [atamalar, setAtamalar] = useState([]); 
  const [sinavlar, setSinavlar] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seciliHucre, setSeciliHucre] = useState(null);
  const [seciliSinavId, setSeciliSinavId] = useState('');
  const [seciliPersonelId, setSeciliPersonelId] = useState('');

  // =========================================================================
  // REİSİN EFSANE DOKUNUŞU: DİNAMİK TARİH HESAPLAMA
  // Sınavlar tablosundaki tarihleri çekip, tekrarlananları siliyor ve sıraya diziyor!
  // =========================================================================
  const tarihler = [...new Set(sinavlar.filter(s => s.tarih).map(s => String(s.tarih).split('T')[0]))].sort();

  const verileriGetir = useCallback(async () => {
    try {
      const [dRes, oRes, pRes, atamaRes, sinavRes] = await Promise.all([
        axios.get('http://localhost:8080/api/derslikler/liste'),
        axios.get('http://localhost:8080/api/oturumlar/liste'),
        axios.get('http://localhost:8080/api/personeller/liste'),
        axios.get('http://localhost:8080/api/atamalar/liste'),
        axios.get('http://localhost:8080/api/sinavlar/liste') 
      ]);
      
      setDerslikler(dRes.data); setOturumlar(oRes.data);
      setPersoneller(pRes.data); setSinavlar(sinavRes.data); 
      
      const formatliAtamalar = atamaRes.data.map(row => ({
        sinavId: row.sinavId || row.SINAVID || row.SinavID, 
        tarih: String(row.tarih || row.TARIH).split('T')[0], 
        oturum: { oturumId: row.oturumId || row.OTURUMID },
        derslik: { derslikId: row.derslikId || row.DERSLIKID, ad: row.derslikAd || row.DERSLIKAD, kapasite: row.kapasite || row.KAPASITE },
        ders: { dersId: row.dersId || row.DERSID, dersAdi: row.dersAdi || row.DERSADI, ogrenciSayisi: row.ogrenciSayisi || row.OGRENCISAYISI, yariyil: row.yariyil || row.YARIYIL },
        personel: { 
            personelId: row.personelId || row.PERSONELID, 
            unvan: row.unvan || row.UNVAN || '', 
            soyad: row.soyad || row.SOYAD || 'Gözetmen Yok' 
        }
      }));
      setAtamalar(formatliAtamalar); 

    } catch (error) {
      console.error(error);
      toast.error("Veriler çekilirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchVeri = async () => {
      if (mounted) await verileriGetir();
    };
    fetchVeri();
    return () => { mounted = false; };
  }, [verileriGetir]);

  const hucreTikla = (tarih, oturum, derslik) => {
    setSeciliHucre({ tarih, oturum, derslik });
    setSeciliSinavId(''); setSeciliPersonelId('');
    setIsModalOpen(true);
  };

  const handleAtamaKaydet = async () => {
    if (!seciliSinavId || !seciliPersonelId) return toast.error("Lütfen seçim yapın!");
    const toastId = toast.loading('Kaydediliyor...');
    try {
      await axios.post('http://localhost:8080/api/atamalar/manuel-kaydet', {
        sinavId: parseInt(seciliSinavId), 
        tarih: seciliHucre.tarih, 
        oturumId: seciliHucre.oturum.oturumId, 
        derslikId: seciliHucre.derslik.derslikId, 
        personelId: parseInt(seciliPersonelId)
      });
      toast.success("Başarıyla kaydedildi.", { id: toastId });
      setIsModalOpen(false);
      await verileriGetir(); 
    } catch (error) {
      const msj = error.response?.data?.message || error.response?.data || "Hata!";
      toast.error(`${msj}`, { id: toastId });
    }
  };

  const sinavIptalEt = async (hucre) => {
    if (!window.confirm("Bu atamayı iptal etmek istediğinize emin misiniz? Sınav boşa düşecektir.")) return;
    const toastId = toast.loading('İptal ediliyor...');
    try {
      await axios.delete(`http://localhost:8080/api/atamalar/sil/${hucre.sinavId}`);
      toast.success("Atama başarıyla kaldırıldı.", { id: toastId });
      await verileriGetir(); 
    } catch (error) {
      const msj = error.response?.data || "İptal sırasında bir hata oluştu!";
      toast.error(msj, { id: toastId });
    }
  };

  let oGunePlanliSinavlar = [];
  let uygunPersoneller = [];

  if (seciliHucre) {
    const { tarih, oturum } = seciliHucre;

    const bugununSinavlari = sinavlar.filter(s => s.tarih && String(s.tarih).split('T')[0] === tarih);

    oGunePlanliSinavlar = bugununSinavlari.filter(sinav => {
      const sinavYariyili = sinav.ders?.yariyil;
      if (!sinavYariyili) return true; 

      const oOturumdakiYariyillar = atamalar
        .filter(a => a.tarih === tarih && a.oturum?.oturumId === oturum.oturumId)
        .map(a => a.ders?.yariyil)
        .filter(Boolean); 
      
      if (oOturumdakiYariyillar.includes(sinavYariyili)) return false; 
      return true;
    });

    uygunPersoneller = personeller.filter(p => {
      const hocaninBugunkuSınavları = atamalar.filter(a => a.tarih === tarih && a.personel?.personelId === p.personelId);
      const ayniSaatteDoluMu = hocaninBugunkuSınavları.some(a => a.oturum?.oturumId === oturum.oturumId);
      if (ayniSaatteDoluMu) return false;

      const gunlukGorevSayisi = new Set(hocaninBugunkuSınavları.map(a => a.oturum?.oturumId).filter(Boolean)).size;
      if (gunlukGorevSayisi >= 4) return false;

      return true;
    });
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center"><LayoutDashboard className="mr-2 text-blue-600" /> Sınav Programı</h1>
          <p className="text-gray-500 text-sm mt-1">Sınav planladığınız tarihler tabloda otomatik olarak belirir.</p>
        </div>
        <div className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border">
          <ShieldCheck className="w-5 h-5 mr-2" /> Canlı Denetim Aktif
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto pb-6">
        <table className="w-full table-fixed border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-100 border-b-2">
              <th className="border-r p-4 text-sm font-bold w-48">Oturum / Derslik</th>
              {/* Tarih yoksa boş durmasın diye uyarı sütunu */}
              {tarihler.length === 0 ? (
                <th className="p-4 text-center text-gray-500 italic font-medium">Henüz planlanmış bir sınav bulunamadı.</th>
              ) : (
                tarihler.map(t => <th key={t} className="border-r p-4 text-center">{new Date(t).toLocaleDateString('tr-TR')}</th>)
              )}
            </tr>
          </thead>
          <tbody>
            {oturumlar.map(oturum => (
              <React.Fragment key={oturum.oturumId}>
                <tr className="bg-blue-600 text-white">
                  <td colSpan={tarihler.length === 0 ? 2 : tarihler.length + 1} className="p-2 font-bold text-center text-sm">
                    {oturum.tanim} ({oturum.baslangicSaat})
                  </td>
                </tr>
                {derslikler.map(derslik => (
                  <tr key={oturum.oturumId + derslik.derslikId} className="border-b hover:bg-gray-50">
                    <td className="border-r p-3 font-bold text-center bg-gray-50 text-sm">
                      {derslik.ad} <br/><span className="text-xs text-gray-500">(Kap: {derslik.kapasite})</span>
                    </td>
                    
                    {tarihler.length === 0 ? (
                      <td className="p-4 text-center text-gray-300 bg-gray-50">Lütfen önce sınav planlayın</td>
                    ) : (
                      tarihler.map(tarih => {
                        const hucre = atamalar.find(a => String(a.tarih)===String(tarih) && String(a.oturum?.oturumId)===String(oturum?.oturumId) && String(a.derslik?.derslikId)===String(derslik?.derslikId));
                        return (
                          <td key={tarih + oturum.oturumId + derslik.derslikId} className="border-r p-2 h-24 relative group cursor-pointer" onClick={() => !hucre && hucreTikla(tarih, oturum, derslik)}>
                            {hucre ? (
                              <div className="flex flex-col h-full justify-between bg-emerald-50 rounded p-2 border border-emerald-200">
                                <div className="flex justify-between items-start w-full">
                                  <span className="text-[11px] font-bold text-emerald-800 leading-tight break-words pr-1">{hucre.ders?.dersAdi}</span>
                                  <button onClick={(e) => { e.stopPropagation(); sinavIptalEt(hucre); }} className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded p-1 shrink-0 transition-colors" title="Atamayı İptal Et">
                                    <span className="text-[10px]">❌</span>
                                  </button>
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 border-t border-emerald-200 pt-1 mt-1 block truncate text-left">
                                  👤 {hucre.personel?.unvan} {hucre.personel?.soyad}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300 hover:text-blue-500 transition-all"><Edit3 className="w-5 h-5"/></div>
                            )}
                          </td>
                        );
                      })
                    )}

                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex justify-between"><h3 className="text-white font-bold">Atama Yap</h3><button onClick={() => setIsModalOpen(false)} className="text-white font-bold text-xl">&times;</button></div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 flex"><AlertTriangle className="w-5 h-5 mr-2 shrink-0"/> Kısıtlara uymayan seçenekler gizlenmiştir.</div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Planlanmış Sınavlar ({oGunePlanliSinavlar.length})</label>
                <select value={seciliSinavId} onChange={e => setSeciliSinavId(e.target.value)} className="w-full border-2 rounded-xl px-4 py-3">
                  <option value="">-- Sınav Seçiniz --</option>
                  {oGunePlanliSinavlar.length === 0 && <option disabled>Bu güne ait uygun sınav bulunamadı!</option>}
                  {oGunePlanliSinavlar.map(s => <option key={s.sinavId} value={s.sinavId}>{s.ders?.dersAdi} ({s.ders?.yariyil}. YY)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Uygun Gözetmenler ({uygunPersoneller.length})</label>
                <select value={seciliPersonelId} onChange={e => setSeciliPersonelId(e.target.value)} className="w-full border-2 rounded-xl px-4 py-3">
                  <option value="">-- Gözetmen Seçiniz --</option>
                  {uygunPersoneller.length === 0 && <option disabled>Uygun gözetmen kalmadı!</option>}
                  {uygunPersoneller.map(p => <option key={p.personelId} value={p.personelId}>{p.unvan} {p.soyad}</option>)}
                </select>
              </div>

              <button onClick={handleAtamaKaydet} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 flex justify-center items-center"><ShieldCheck className="w-5 h-5 mr-2" /> Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import { DatabaseBackup } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Topbar = () => {
  const [yaklasiyorMu, setYaklasiyor] = useState(false);

  const handleBackup = async () => {
    setYaklasiyor(true);
    try {
      const response = await axios.post('http://localhost:8080/api/durumlar/yedekle');
      
      // Response'ı kontrol et ve uygun mesaj göster
      if (response.status === 200 && response.data?.status === 'success') {
        toast.success(response.data?.message || 'Veritabanı yedeği başarıyla alındı!', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
          }
        });
      } else {
        toast.error(response.data?.message || 'Yedekleme işlemi tamamlandı ama beklenmeyen yanıt alındı.', {
          duration: 4000
        });
      }
    } catch (error) {
      console.error("Yedekleme hatası detaylı:", error.response || error);
      
      // Backend'den gelen hata mesajını göster, yoksa genel mesaj
      const errorMsg = error.response?.data?.message || error.message || 'Yedekleme sırasında hata oluştu!';
      toast.error(errorMsg, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
        }
      });
    } finally {
      setYaklasiyor(false);
    }
  };

  return (
    <header className="bg-white border-b-4 border-blue-600 h-16 flex items-center justify-between px-8 shadow-sm shrink-0">
      <div className="flex-1" />
      
      <div className="flex items-center space-x-6">
        {/* BONUS: Veritabanı Yedekleme Butonu */}
        <button 
          onClick={handleBackup}
          disabled={yaklasiyorMu}
          className="flex items-center text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-lg border hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DatabaseBackup className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold">{yaklasiyorMu ? 'Yedekleniyor...' : 'Sistemi Yedekle (.bak)'}</span>
        </button>
        
        <div className="text-sm border-l pl-6 py-1">
          <span className="text-gray-500">Hoş geldin, </span>
          <span className="font-bold text-blue-700">Sınav Koordinatörü</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
import { DatabaseBackup } from 'lucide-react';

const Topbar = () => {
  return (
    <header className="bg-white border-b-4 border-blue-600 h-16 flex items-center justify-between px-8 shadow-sm shrink-0">
      <div className="text-xl font-bold text-gray-700">
        Admin Panel
      </div>
      
      <div className="flex items-center space-x-6">
        {/* BONUS: Veritabanı Yedekleme Butonu */}
        <button className="flex items-center text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-lg border hover:border-blue-300">
          <DatabaseBackup className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold">Sistemi Yedekle (.bak)</span>
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
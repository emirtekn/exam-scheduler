import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SinavAtama from './pages/SinavAtama';
import DersYonetimi from './pages/DersYonetimi'; 
import DerslikYonetimi from './pages/DerslikYonetimi'; 
import PersonelYonetimi from './pages/PersonelYonetimi';
import MazeretYonetimi from './pages/MazeretYonetimi';         
import OturumYonetimi from './pages/OturumYonetimi';    


function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sinav-atama" element={<SinavAtama />} />
          <Route path="ders-yonetimi" element={<DersYonetimi />} />
          <Route path="derslik-yonetimi" element={<DerslikYonetimi />} />
          <Route path="personel-yonetimi" element={<PersonelYonetimi />} />
          <Route path="mazeret-yonetimi" element={<MazeretYonetimi />} />
          <Route path="/oturum-yonetimi" element={<OturumYonetimi />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
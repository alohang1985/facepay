import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import FaceDetailPage from './pages/FaceDetailPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyLicensesPage from './pages/MyLicensesPage';
import RegisterFacePage from './pages/RegisterFacePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/face/:id" element={<FaceDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/my-licenses" element={<ProtectedRoute><MyLicensesPage /></ProtectedRoute>} />
        <Route path="/register-face" element={<ProtectedRoute><RegisterFacePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

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
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import MyFacesPage from './pages/MyFacesPage';
import WishlistPage from './pages/WishlistPage';
import EarningsPage from './pages/EarningsPage';
import MessagesPage from './pages/MessagesPage';
import ApiKeysPage from './pages/ApiKeysPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PricingPage from './pages/PricingPage';
import RankingsPage from './pages/RankingsPage';
import ComparePage from './pages/ComparePage';
import ProviderPage from './pages/ProviderPage';
import ProtectionPage from './pages/ProtectionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/face/:id" element={<FaceDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/provider/:id" element={<ProviderPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/my-licenses" element={<ProtectedRoute><MyLicensesPage /></ProtectedRoute>} />
        <Route path="/register-face" element={<ProtectedRoute><RegisterFacePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/my-faces" element={<ProtectedRoute><MyFacesPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
        <Route path="/protection" element={<ProtectedRoute><ProtectionPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

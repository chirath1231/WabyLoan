import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LangProvider } from './context/LangContext.jsx';
import Header from './components/Header.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ApplyPage from './pages/ApplyPage.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminBanksPage from './admin/AdminBanksPage.jsx';
import AdminProductsPage from './admin/AdminProductsPage.jsx';
import AdminOccupationsPage from './admin/AdminOccupationsPage.jsx';
import AdminCompanyListsPage from './admin/AdminCompanyListsPage.jsx';
import AdminSettingsPage from './admin/AdminSettingsPage.jsx';
import AdminLeadsPage from './admin/AdminLeadsPage.jsx';
import AdminUsersPage from './admin/AdminUsersPage.jsx';
import AdminAuditLogPage from './admin/AdminAuditLogPage.jsx';

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="banks" element={<AdminBanksPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="occupations" element={<AdminOccupationsPage />} />
              <Route path="company-lists" element={<AdminCompanyListsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="audit-log" element={<AdminAuditLogPage />} />
            </Route>
          </Routes>
          <AuthPanel />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}

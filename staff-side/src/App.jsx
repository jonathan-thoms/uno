import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MenuManagementPage from './pages/MenuManagementPage';
import TableManagementPage from './pages/TableManagementPage';
import ActiveOrdersPage from './pages/ActiveOrdersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="tables" element={<TableManagementPage />} />
            <Route path="orders" element={<ActiveOrdersPage />} />
          </Route>

          {/* Catch-all: redirect to admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

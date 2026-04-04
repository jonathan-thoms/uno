import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import HomePage from './pages/HomePage';
import TablePage from './pages/TablePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing / fallback */}
          <Route path="/" element={<HomePage />} />

          {/* Core QR entry point — session init happens here */}
          <Route path="/table/:tableId" element={<TablePage />} />

          {/* Menu browsing (after session is established) */}
          <Route path="/menu" element={<MenuPage />} />

          {/* Shared cart view */}
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

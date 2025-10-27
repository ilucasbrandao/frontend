import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/Login.jsx';
import { ProductsPage } from './pages/Products/ProductsPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx'; // <-- NOVO
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';
import { AdminPage } from './pages/AdminPage.jsx';

function App() {
  return (
    <Routes>
      {/* Rota Pública */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rota de ADMIN (precisa vir antes de '/') */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      {/* Rotas Protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersPage /> {/* <-- NOVO */}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/Login.jsx';
import { DashboardPage } from './pages/Dashboard.jsx';
import { CustomersPage } from './pages/CustomersPage.jsx'; // <-- NOVO
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* Rota Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
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
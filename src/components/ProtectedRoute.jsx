import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Redireciona para o login se não estiver logado
        return <Navigate to="/login" replace />;
    }

    return children;
};
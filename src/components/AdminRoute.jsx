import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};
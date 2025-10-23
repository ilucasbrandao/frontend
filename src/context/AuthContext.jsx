import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Onde nossa API está
const API_URL = 'http://localhost:3000/api';

const AuthContext = createContext();

// 2. O Provedor
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    //  Função de LOGIN
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            const { token: receivedToken, user: receivedUser } = response.data;
            setToken(receivedToken);
            setUser(receivedUser);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao fazer login');
            setLoading(false);
            throw err; // Lança o erro para a tela de login tratar
        }
    };

    // Função de LOGOUT
    const logout = () => {
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado para facilitar o uso
export const useAuth = () => {
    return useContext(AuthContext);
};
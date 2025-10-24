import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Onde nossa API está
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AuthContext = createContext();

// 2. O Provedor
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
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
            localStorage.setItem('token', receivedToken);
            localStorage.setItem('user', JSON.stringify(receivedUser)); // <-- Salve o user
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
    const logout = async () => {
        // 1. Pega o token atual para enviar na requisição
        const currentToken = localStorage.getItem('token');

        // 2. Limpa o estado local IMEDIATAMENTE.
        // Isso joga o usuário para a tela de login, o que é o comportamento esperado.
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // <-- Limpe o user
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');

        if (currentToken) {
            try {
                // 3. Em background, avisa a API para destruir a sessão no banco
                await axios.post(
                    `${API_URL}/auth/logout`,
                    {}, // Envia um corpo vazio
                    {
                        headers: {
                            'Authorization': `Bearer ${currentToken}`
                        }
                    }
                );
                // console.log('Sessão destruída no backend');
            } catch (err) {
                // Se a API falhar (ex: token já expirou), não faz mal.
                // O usuário já foi deslogado localmente.
                console.error('Erro ao fazer logout na API:', err.message);
            }
        }
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
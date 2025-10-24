import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const RegisterPage = () => {
    const [tenantName, setTenantName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                tenantName,
                email,
                password,
            });
            setMessage(response.data.message); // "Cadastro realizado..."
            setTimeout(() => navigate('/login'), 3000); // Volta pro login
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>

                {message && <p className="text-green-600 text-sm mb-4">{message}</p>}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="mb-4">
                    <label>Nome da Empresa</label>
                    <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)}
                        className="w-full px-3 py-2 mt-1 border rounded-md" required />
                </div>
                <div className="mb-4">
                    <label>Seu Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 mt-1 border rounded-md" required />
                </div>
                <div className="mb-6">
                    <label>Sua Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 mt-1 border rounded-md" required />
                </div>
                <button type="submit" disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                    {loading ? 'Registrando...' : 'Registrar'}
                </button>
                <p className="text-sm text-center mt-4">
                    Já tem conta? <Link to="/login" className="text-blue-600 hover:underline">Faça login</Link>
                </p>
            </form>
        </div>
    );
};
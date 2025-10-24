import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage = () => {
    const [email, setEmail] = useState('user@empresa-a.com'); // <-- Valor padrão para teste
    const [password, setPassword] = useState('senha123'); // <-- Valor padrão para teste
    const [localError, setLocalError] = useState('');

    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        try {
            await login(email, password);
            navigate('/'); // Redireciona para o Dashboard após sucesso
        } catch (err) {
            setLocalError(err.message || 'Falha no login');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

                {localError && <p className="text-red-500 text-sm mb-4">{localError}</p>}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 mt-1 border rounded-md"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 mt-1 border rounded-md"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <p className="text-sm text-center text-gray-600 mt-6">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:underline">
                        Crie sua solicitação
                    </Link>
                </p>
            </form>
        </div>
    );
};
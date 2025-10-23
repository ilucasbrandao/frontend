import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Layout } from '../components/Layout'; // <-- Importe o Layout

export const DashboardPage = () => {
    const { token, logout } = useAuth(); // Removido 'user' daqui, pois o Layout cuida
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // ... (o fetchProducts continua exatamente igual) ...
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const apiClient = axios.create({
                    baseURL: 'http://localhost:3000/api',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const response = await apiClient.get('/products');
                setProducts(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Erro ao buscar produtos');
                if (err.response?.status === 401) logout();
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProducts();
    }, [token, logout]);

    return (
        <Layout> {/* <-- Envolva com o Layout */}
            <h1 className="text-3xl font-bold mb-6">Seus Produtos</h1>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {loading && <p className="p-4">Carregando...</p>}
                {error && <p className="p-4 text-red-600">{error}</p>}

                <ul className="divide-y divide-gray-200">
                    {products.map((product) => (
                        <li key={product.id} className="px-6 py-4">
                            <span className="font-medium text-lg">{product.name}</span>
                            <span className="text-gray-500 ml-4">(ID: {product.id})</span>
                        </li>
                    ))}
                    {!loading && products.length === 0 && <p className="p-4">Nenhum produto encontrado.</p>}
                </ul>
            </div>
        </Layout>
    );
};
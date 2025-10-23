import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Layout } from '../components/Layout'; // <-- Vamos criar este layout!

export const CustomersPage = () => {
    const { token, logout } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const apiClient = axios.create({
                    baseURL: 'http://localhost:3000/api',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const response = await apiClient.get('/customers');
                setCustomers(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Erro ao buscar clientes');
                if (err.response?.status === 401) logout();
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [token, logout]);

    return (
        <Layout> {/* <-- Usando o Layout */}
            <h1 className="text-3xl font-bold mb-6">Seus Clientes</h1>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {loading && <p className="p-4">Carregando...</p>}
                {error && <p className="p-4 text-red-600">{error}</p>}

                <ul className="divide-y divide-gray-200">
                    {customers.map((customer) => (
                        <li key={customer.id} className="px-6 py-4 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-lg">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                            </div>
                            <span className="text-gray-500 text-sm">{customer.phone}</span>
                        </li>
                    ))}
                    {!loading && customers.length === 0 && <p className="p-4">Nenhum cliente encontrado.</p>}
                </ul>
            </div>
        </Layout>
    );
};
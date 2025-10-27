import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Layout } from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AdminPage = () => {
    const { token, logout } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [loadingTenants, setLoadingTenants] = useState(true);
    const [error, setError] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    const apiClient = useMemo(() => {
        return axios.create({
            baseURL: API_URL,
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }, [token]);

    const fetchTenants = useCallback(async () => {
        try {
            setLoadingTenants(true);
            const response = await apiClient.get('/admin/tenants');
            setTenants(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao buscar tenants');
            if (err.response?.status === 401) logout();
        } finally {
            setLoadingTenants(false);
        }
    }, [apiClient, logout]);

    const fetchActiveSessions = useCallback(async (isFirstLoad = false) => {
        if (isFirstLoad) setLoadingSessions(true);
        try {
            const response = await apiClient.get('/admin/sessions/active');
            setActiveSessions(response.data);
        } catch (err) {
            console.error("Erro ao buscar sessões ativas:", err.message);
            if (err.response?.status === 401) logout();
        } finally {
            if (isFirstLoad) setLoadingSessions(false);
        }
    }, [apiClient, logout]);

    useEffect(() => {
        fetchTenants();
        fetchActiveSessions(true);
        const intervalId = setInterval(() => { fetchActiveSessions(false); }, 10000);
        return () => clearInterval(intervalId);
    }, [fetchTenants, fetchActiveSessions]);

    // Funções handleApprove e handleSetStatus 
    const handleApprove = async (tenantId) => {
        if (!window.confirm('Tem certeza que deseja APROVAR e criar o schema para este tenant?')) return;
        try {
            await apiClient.post(`/admin/tenants/${tenantId}/approve`);
            alert('Tenant aprovado com sucesso!');
            fetchTenants(); // Re-busca a lista
        } catch (err) {
            alert('Erro ao aprovar: ' + err.response?.data?.message);
        }
    };

    const handleSetStatus = async (tenantId, newStatus) => {
        if (!window.confirm(`Tem certeza que deseja mudar o status para "${newStatus}"?`)) return;
        try {
            await apiClient.put(`/admin/tenants/${tenantId}/status`, { status: newStatus });
            alert('Status atualizado!');
            fetchTenants(); // Re-busca a lista
        } catch (err) {
            alert('Erro ao atualizar status: ' + err.response?.data?.message);
        }
    };

    return (
        <Layout>
            {/* --- Bloco de Gestão de Tenants  --- */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Gestão de Tenants</h1>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                {loadingTenants && <p className="p-4">Carregando tenants...</p>}
                {error && <p className="p-4 text-red-600">{error}</p>}

                {!loadingTenants && !error && (
                    <ul className="divide-y divide-gray-200">
                        <li className="hidden sm:grid sm:grid-cols-5 gap-x-4 items-center px-4 sm:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="sm:col-span-1">Empresa</div>
                            <div>Email</div>
                            <div className="text-center sm:text-left">Logins</div>
                            <div className="text-center sm:text-left">Status</div>
                            <div className="text-center sm:text-left">Ações</div>
                        </li>
                        {tenants.map((tenant) => (
                            <li key={tenant.id} className="p-4 sm:px-6 hover:bg-gray-50">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2 items-center">
                                    <div className="col-span-2 sm:col-span-1 font-medium text-gray-900 truncate">{tenant.name}</div>

                                    <div className="text-sm text-gray-500 truncate col-span-2 sm:col-span-1">
                                        <span className="font-semibold sm:hidden">Email: </span> {/* Rótulo para mobile */}
                                        {tenant.admin_email || 'N/A'}
                                    </div>

                                    <div className="text-sm text-gray-500 text-right sm:text-left">
                                        <span className="font-semibold sm:hidden">Logins: </span>
                                        {tenant.login_count}
                                    </div>

                                    <div className="text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                                            tenant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {tenant.status}
                                        </span>
                                    </div>

                                    {/* Ações (Alinhado à direita na segunda linha do mobile) */}
                                    <div className="col-start-2 sm:col-start-auto flex justify-end sm:justify-start space-x-2 text-sm font-medium">
                                        {tenant.status === 'pending' && (
                                            <button onClick={() => handleApprove(tenant.id)} className="text-indigo-600 hover:text-indigo-900">Aprovar</button>
                                        )}
                                        {tenant.status === 'active' && (
                                            <button onClick={() => handleSetStatus(tenant.id, 'blocked')} className="text-red-600 hover:text-red-900">Bloquear</button>
                                        )}
                                        {tenant.status === 'blocked' && (
                                            <button onClick={() => handleSetStatus(tenant.id, 'active')} className="text-green-600 hover:text-green-900">Reativar</button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {tenants.length === 0 && !loadingTenants && (
                            <li className="p-4 text-center text-gray-500 sm:col-span-5">Nenhum tenant encontrado.</li>
                        )}
                    </ul>
                )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Usuários Ativos (Últimos 5 min)</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {loadingSessions && <p className="p-4">Carregando sessões...</p>}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário (Email)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa (Tenant)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visto por Último</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeSessions.map((session) => (
                                <tr key={session.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 mr-2 shrink-0"></span>
                                        <span className="truncate">{session.email}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.tenant_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(session.last_seen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}

                            {!loadingSessions && activeSessions.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                        Nenhum usuário ativo no momento.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};
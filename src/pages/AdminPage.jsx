import { useEffect, useState, useCallback, useMemo } from 'react'; // <-- 1. Importar useMemo
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Layout } from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AdminPage = () => {
    const { token, logout } = useAuth(); // 'token' é a dependência chave
    const [tenants, setTenants] = useState([]);
    const [loadingTenants, setLoadingTenants] = useState(true);
    const [error, setError] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    // --- 2. MEMORIZAR o apiClient ---
    // Este objeto só será recriado se o 'token' mudar.
    const apiClient = useMemo(() => {
        // console.log("Recriando apiClient..."); // (para debug)
        return axios.create({
            baseURL: API_URL,
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }, [token]); // <-- Dependência é o token

    // --- 3. CALLBACKS DEPENDENDO DO apiClient MEMORIZADO ---
    // Esta função agora depende de 'apiClient' (que é estável)
    // e 'logout' (que vem do contexto).
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
    }, [apiClient, logout]); // 'apiClient' agora é estável

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
    }, [apiClient, logout]); // 'apiClient' agora é estável

    // --- 4. useEffect DEPENDENDO DAS FUNÇÕES MEMORIZADAS ---
    useEffect(() => {
        fetchTenants();
        fetchActiveSessions(true); // true = é a primeira carga

        const intervalId = setInterval(() => {
            fetchActiveSessions(false); // false = não é a primeira carga
        }, 10000);

        return () => clearInterval(intervalId);
    }, [fetchTenants, fetchActiveSessions]); // Agora estas funções são estáveis


    const handleApprove = async (tenantId) => {
        if (!window.confirm('Tem certeza que deseja APROVAR e criar o schema para este tenant?')) return;
        try {
            await apiClient.post(`/admin/tenants/${tenantId}/approve`);
            alert('Tenant aprovado com sucesso!');
            fetchTenants(); // Esta chamada agora é estável
        } catch (err) {
            alert('Erro ao aprovar: ' + err.response?.data?.message);
        }
    };

    const handleSetStatus = async (tenantId, newStatus) => {
        if (!window.confirm(`Tem certeza que deseja mudar o status para "${newStatus}"?`)) return;
        try {
            await apiClient.put(`/admin/tenants/${tenantId}/status`, { status: newStatus });
            alert('Status atualizado!');
            fetchTenants(); // Esta chamada agora é estável
        } catch (err) {
            alert('Erro ao atualizar status: ' + err.response?.data?.message);
        }
    };

    return (
        <Layout>
            {/* Bloco de Gestão de Tenants */}
            <h1 className="text-3xl font-bold mb-6">Gestão de Tenants</h1>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                {/* O loading só deve aparecer na primeira carga agora */}
                {loadingTenants && <p className="p-4">Carregando tenants...</p>}
                {error && <p className="p-4 text-red-600">{error}</p>}

                {/* Se não estiver carregando e não houver erro, mostrar a tabela */}
                {!loadingTenants && !error && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logins</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{tenant.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{tenant.admin_email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{tenant.login_count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                                            tenant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {tenant.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {tenant.status === 'pending' && (
                                            <button onClick={() => handleApprove(tenant.id)} className="text-indigo-600 hover:text-indigo-900 mr-3">Aprovar</button>
                                        )}
                                        {tenant.status === 'active' && (
                                            <button onClick={() => handleSetStatus(tenant.id, 'blocked')} className="text-red-600 hover:text-red-900">Bloquear</button>
                                        )}
                                        {tenant.status === 'blocked' && (
                                            <button onClick={() => handleSetStatus(tenant.id, 'active')} className="text-green-600 hover:text-green-900">Reativar</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- Bloco "Quem está online?" --- */}
            <h2 className="text-2xl font-bold mb-6">Usuários Ativos (Últimos 5 min)</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {loadingSessions && <p className="p-4">Carregando sessões...</p>}

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário (Email)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa (Tenant)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visto por Último</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {activeSessions.map((session) => (
                            <tr key={session.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-block h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                                    {session.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{session.tenant_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(session.last_seen).toLocaleTimeString('pt-BR')}
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
        </Layout>
    );
};
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Layout } from "../components/Layout";
import { SlideOver } from "../components/SlideOver";
import CustomerForm from "../components/CustomerForm";
import { useNavigate } from "react-router-dom";
import {
    TrashIcon,
    PencilSquareIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Componente Skeleton (mantido - excelente para UX)
const CustomerSkeleton = () => (
    <li className="p-4 sm:px-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
    </li>
);

export default function CustomersPage() {
    const { token, logout } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsModalOpen] = useState(false);
    const [modalError, setModalError] = useState(null);
    // Usamos um estado separado para o cliente a ser editado/carregado (seja o ID ou o objeto)
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Busca/pesquisa/paginação
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [sortBy] = useState("name"); // opcional - Mantido (pode ser útil)
    const [sortDir] = useState("asc"); // opcional - Mantido (pode ser útil)
    const navigate = useNavigate(); // Se for usar navegação

    // debounce simples (Mantido - OK)
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(t);
    }, [query]);

    // cliente axios memoizado (Mantido - OK)
    const apiClient = useMemo(() => {
        return axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${token}` },
        });
    }, [token]);

    // Funções de Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null); // Limpa o cliente em edição ao fechar
        setModalError(null);
    };

    const openCreateModal = () => {
        setEditingCustomer(null); // Garante que está no modo de criação
        setIsModalOpen(true);
    };

    const fetchCustomers = useCallback(
        async (opts = {}) => {
            setError(null);
            setLoading(true);
            try {
                // Parâmetros de consulta
                const params = {
                    q: opts.q ?? debouncedQuery ?? "",
                    page: opts.page ?? page,
                    perPage,
                    sortBy,
                    sortDir,
                };
                const response = await apiClient.get("/customers", { params });
                const customerArray = response.data;

                setCustomers(customerArray || []);
                setTotal(customerArray.length ?? 0); // Garantir um número, mesmo que 0
            } catch (err) {
                const msg = err.response?.data?.message || "Erro ao buscar clientes";
                setError(msg);
                if (err.response?.status === 401) logout();
            } finally {
                setLoading(false);
            }
        },
        [apiClient, debouncedQuery, page, perPage, sortBy, sortDir, logout] // Adicionei 'page' de volta aqui
    );

    useEffect(() => {
        // Redefine para a página 1 em nova busca
        setPage(1);
    }, [debouncedQuery]);

    useEffect(() => {
        // Agora, o `fetchCustomers` precisa ser chamado com a `page` atualizada.
        // Se a página mudou, ele executa o fetch. Se `debouncedQuery` mudou, o `useEffect` anterior setou page=1, e este aqui roda.
        fetchCustomers({ page });
    }, [fetchCustomers, page]);

    // criar/atualizar - Função unificada de save
    const handleSaveCustomer = async (formData) => {
        setModalError(null);
        const isEditing = !!editingCustomer;
        try {
            if (isEditing) {
                await apiClient.put(`/customers/${editingCustomer.id}`, formData);
            } else {
                await apiClient.post("/customers", formData);
            }
            closeModal();

            // Refetch: Força o recarregamento. No caso de edição, mantém a página.
            // No caso de criação, pode ser bom voltar para a página 1 ou ficar na atual,
            // dependendo se o backend insere o novo item no início ou no fim da lista.
            // Para simplificar, recarregamos a página atual.
            fetchCustomers({ page });
        } catch (err) {
            // Lança o erro para o useForm poder capturá-lo (se estiver usando a função handleSubmit sugerida)
            setModalError(
                err.response?.data?.message ||
                `Erro ao ${isEditing ? "atualizar" : "salvar"} cliente`
            );
            throw err; // IMPORTANTE: Repassa o erro para o useForm/caller
        }
    };

    const handleEditClick = async (customerId) => {
        setError(null); // Limpa erros anteriores
        setLoading(true); // Inicia o loading

        try {
            // 1. SEMPRE busca os dados completos do cliente pela API
            const response = await apiClient.get(`/customers/${customerId}`);
            const customerDataFromApi = response.data; // Pega os dados da resposta

            // 2. Formata a data ANTES de definir o estado
            if (
                customerDataFromApi.birth_date &&
                typeof customerDataFromApi.birth_date === "string"
            ) {
                customerDataFromApi.birth_date =
                    customerDataFromApi.birth_date.split("T")[0];
            } else {
                customerDataFromApi.birth_date = ""; // Garante que é uma string vazia se for null/undefined
            }

            // 3. Define o estado com os dados FRESCOS e FORMATADOS
            setEditingCustomer(customerDataFromApi);

            // 4. Abre o modal/slide-over OU navega para a página de edição
            setIsModalOpen(true);
            // OU (se preferir a página dedicada):
            // navigate(`/customers/edit/${customerId}`); // Descomente esta linha e comente a anterior se for para a página
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Erro ao carregar dados do cliente para edição."
            );
        } finally {
            setLoading(false); // Finaliza o loading
        }
    };

    const handleDeleteClick = async (customerId, customerName) => {
        if (!window.confirm(`Excluir "${customerName}"? Esta ação é irreversível.`))
            return;
        try {
            await apiClient.delete(`/customers/${customerId}`);

            // Melhora a UX: Em vez de apenas manipular o estado local, refaça o fetch para garantir a consistência
            // E lida com a lógica de paginação corretamente (voltar página se ficar vazia)
            const newTotal = total - 1;
            const newCustomersLength = customers.length - 1;

            // Se for o último item da página e não for a primeira página, volta uma página
            if (newCustomersLength === 0 && page > 1) {
                setPage((prev) => prev - 1);
            } else {
                // Caso contrário, apenas refaz o fetch da página atual para obter a lista atualizada
                fetchCustomers({ page });
            }
            setTotal(newTotal);
            // setCustomers(prev => prev.filter(c => c.id !== customerId)) // (Opção mais rápida, mas menos segura para consistência)
        } catch (err) {
            alert(err.response?.data?.message || "Erro ao excluir cliente.");
        }
    };

    // render list (Mantido - OK)
    const renderCustomerList = () => {
        // ... (seu código de renderização do esqueleto/erro/lista)
        if (loading && customers.length === 0)
            return (
                <>
                    <CustomerSkeleton />
                    <CustomerSkeleton />
                    <CustomerSkeleton />
                </>
            );
        if (error)
            return (
                <li className="p-4 sm:px-6 text-red-600">
                    <p>
                        <strong>Erro:</strong> {error}
                    </p>
                    <button
                        onClick={() => fetchCustomers({ page })}
                        className="mt-2 rounded-md bg-blue-50 py-1 px-3 text-sm text-blue-700"
                    >
                        Tentar Novamente
                    </button>
                </li>
            );
        if (customers.length === 0 && !loading)
            return (
                <li className="p-4 sm:px-6 text-gray-500">
                    Nenhum cliente encontrado.
                </li>
            );

        return customers.map((customer) => (
            <li key={customer.id} className="p-4 sm:px-6 hover:bg-gray-50">
                {/* Grid: 2 colunas no mobile (info + actions), layout mais complexo no sm+ */}
                <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_2fr_1fr_auto] gap-x-4 gap-y-1 items-center">

                    {/* Col 1: Nome (ocupa mais espaço em telas maiores) */}
                    <div className="sm:col-span-1 truncate">
                        <p className="text-md font-medium text-blue-700 truncate">
                            {customer.name}
                        </p>
                        {/* Email aparece abaixo no mobile, ao lado no sm+ */}
                        <p className="text-sm text-gray-600 truncate sm:hidden">{customer.email}</p>
                    </div>

                    {/* Col 2: Email (visível apenas em sm+) */}
                    <div className="hidden sm:block text-sm text-gray-600 truncate">
                        {customer.email}
                    </div>

                    {/* Col 3: Status (visível apenas em sm+) */}
                    <div className="hidden sm:block text-sm">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.status === "ativo" ? "bg-green-100 text-green-800"
                                : customer.status === "lead" ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"}`}
                        >
                            {customer.status}
                        </span>
                    </div>

                    {/* Col 4: Ações (sempre na direita) */}
                    <div className="flex justify-end items-center space-x-2 row-start-1 sm:row-start-auto col-start-2 sm:col-start-auto">
                        <button
                            onClick={() => handleEditClick(customer.id)}
                            title="Editar"
                            className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100" // Fundo mais sutil no hover
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleDeleteClick(customer.id, customer.name)}
                            title="Excluir"
                            className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100" // Fundo mais sutil no hover
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Status aparece abaixo do nome no mobile */}
                    <div className="text-sm sm:hidden col-start-1 row-start-2">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.status === "ativo" ? "bg-green-100 text-green-800"
                                : customer.status === "lead" ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"}`}
                        >
                            {customer.status}
                        </span>
                    </div>

                </div>
            </li>
        ));
    };

    // Paginação
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const gotoPage = (p) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
    };

    return (
        <Layout>
            {/* CABEÇALHO DA PÁGINA (Refatorado para Responsividade) */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seus Clientes</h1>
                {/* Container para busca e botão */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                    <input
                        placeholder="Buscar por nome ou email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm p-2 w-full sm:w-64" // Largura ajustada
                    />
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 whitespace-nowrap" // justify-center e whitespace-nowrap
                    >
                        <PlusIcon className="w-4 h-4 mr-1" /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">{renderCustomerList()}</ul>
            </div>

            {/* CONTROLES DE PAGINAÇÃO (Refatorado para Responsividade) */}
            {total > 0 && ( // Só mostra paginação se houver itens
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-y-3">
                    {/* Texto informativo */}
                    <div className="text-sm text-gray-600">
                        Mostrando página {page} de {totalPages} — {total} registros
                    </div>
                    {/* Botões de Paginação */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                            onClick={() => gotoPage(page - 1)}
                            disabled={page === 1}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        {/* Números (escondidos no mobile) */}
                        <div className="hidden sm:flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                let start = Math.max(1, Math.min(totalPages - 4, page - 2));
                                const p = start + i;
                                if (p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => gotoPage(p)}
                                        className={`px-3 py-1 rounded text-sm ${p === page ? "bg-blue-600 text-white" : "border hover:bg-gray-100"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Número da página atual (visível SÓ no mobile) */}
                        <span className="sm:hidden px-3 py-1 text-sm text-gray-500">
                            Pág {page}
                        </span>
                        <button
                            onClick={() => gotoPage(page + 1)}
                            disabled={page === totalPages}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL AJUSTADO: Passando props e título dinâmico */}
            <SlideOver
                isOpen={isOpen}
                onClose={closeModal}
                title={
                    editingCustomer
                        ? `Editar Cliente: ${editingCustomer.name}`
                        : "Cadastrar Cliente"
                }
                size="lg"
            >
                {/* O CustomerForm agora recebe os dados iniciais e a função de submit */}
                <CustomerForm
                    initialData={editingCustomer}
                    onSubmit={handleSaveCustomer}
                    onClose={closeModal}
                    modalError={modalError}
                />
            </SlideOver>
        </Layout>
    );
}
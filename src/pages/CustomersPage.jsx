import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { Layout } from '../components/Layout'
import { Modal } from '../components/Modal'
import CustomerForm from '../components/CustomerForm'
import {
    TrashIcon,
    PencilSquareIcon,
    PlusIcon
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Componente Skeleton (mantido - excelente para UX)
const CustomerSkeleton = () => (
    <li className='p-4 sm:px-6 animate-pulse'>
        <div className='h-4 bg-gray-200 rounded w-1/3'></div>
        <div className='h-3 bg-gray-200 rounded w-1/2 mt-2'></div>
    </li>
)

export const CustomersPage = () => {
    const { token, logout } = useAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isOpen, setIsModalOpen] = useState(false)
    const [modalError, setModalError] = useState(null)
    // Usamos um estado separado para o cliente a ser editado/carregado (seja o ID ou o objeto)
    const [editingCustomer, setEditingCustomer] = useState(null)

    // Busca/pesquisa/paginação
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [page, setPage] = useState(1)
    const [perPage] = useState(10)
    const [total, setTotal] = useState(0)
    const [sortBy] = useState('name') // opcional - Mantido (pode ser útil)
    const [sortDir] = useState('asc') // opcional - Mantido (pode ser útil)

    // debounce simples (Mantido - OK)
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 400)
        return () => clearTimeout(t)
    }, [query])

    // cliente axios memoizado (Mantido - OK)
    const apiClient = useMemo(() => {
        return axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${token}` }
        })
    }, [token])

    // Funções de Modal
    const closeModal = () => {
        setIsModalOpen(false)
        setEditingCustomer(null) // Limpa o cliente em edição ao fechar
        setModalError(null)
    }

    const openCreateModal = () => {
        setEditingCustomer(null) // Garante que está no modo de criação
        setIsModalOpen(true)
    }

    // fetch com paginação/consulta. Removida a lógica de filtragem/paginação local no frontend!
    // O backend DEVE ser o responsável por isso para garantir performance e escalabilidade.
    const fetchCustomers = useCallback(
        async (opts = {}) => {
            setError(null)
            setLoading(true)
            try {
                // Parâmetros de consulta
                const params = {
                    q: opts.q ?? debouncedQuery ?? '',
                    page: opts.page ?? page,
                    perPage,
                    sortBy,
                    sortDir
                }
                const response = await apiClient.get('/customers', { params })

                const data = response.data

                // ASSUME o formato esperado do backend: { data: [...], total: N }
                setCustomers(data.data || [])
                setTotal(data.total ?? 0) // Garantir um número, mesmo que 0

            } catch (err) {
                const msg = err.response?.data?.message || 'Erro ao buscar clientes'
                setError(msg)
                if (err.response?.status === 401) logout()
            } finally {
                setLoading(false)
            }
        },
        // Dependências atualizadas. Removi `page` pois ela é passada como `opts.page` ou lida no useEffect.
        // O `fetchCustomers` só é chamado no useEffect quando o `debouncedQuery` ou `page` mudam, ou quando é acionado por mutação (save/delete).
        [apiClient, debouncedQuery, perPage, sortBy, sortDir, logout]
    )

    useEffect(() => {
        // Redefine para a página 1 em nova busca
        setPage(1)
    }, [debouncedQuery])

    useEffect(() => {
        // Agora, o `fetchCustomers` precisa ser chamado com a `page` atualizada.
        // Se a página mudou, ele executa o fetch. Se `debouncedQuery` mudou, o `useEffect` anterior setou page=1, e este aqui roda.
        fetchCustomers({ page })
    }, [fetchCustomers, page])

    // criar/atualizar - Função unificada de save
    const handleSaveCustomer = async formData => {
        setModalError(null)
        const isEditing = !!editingCustomer
        try {
            if (isEditing) {
                await apiClient.put(`/customers/${editingCustomer.id}`, formData)
            } else {
                await apiClient.post('/customers', formData)
            }
            closeModal()

            // Refetch: Força o recarregamento. No caso de edição, mantém a página.
            // No caso de criação, pode ser bom voltar para a página 1 ou ficar na atual, 
            // dependendo se o backend insere o novo item no início ou no fim da lista.
            // Para simplificar, recarregamos a página atual.
            fetchCustomers({ page })

        } catch (err) {
            // Lança o erro para o useForm poder capturá-lo (se estiver usando a função handleSubmit sugerida)
            setModalError(
                err.response?.data?.message ||
                `Erro ao ${isEditing ? 'atualizar' : 'salvar'} cliente`
            )
            throw err // IMPORTANTE: Repassa o erro para o useForm/caller
        }
    }

    const handleEditClick = async customerId => {
        // Melhoria: Usar o dado em cache se disponível e a edição for simples.
        // Se o seu formulário for complexo, mantenha o fetch completo como você fez.
        const customerCached = customers.find(c => c.id === customerId);

        if (customerCached) {
            setEditingCustomer(customerCached);
            setIsModalOpen(true);
            return;
        }

        try {
            setLoading(true)
            const response = await apiClient.get(`/customers/${customerId}`)
            setEditingCustomer(response.data)
            setIsModalOpen(true)
        } catch (err) {
            setError(
                err.response?.data?.message || 'Erro ao carregar dados para edição.'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = async (customerId, customerName) => {
        if (!window.confirm(`Excluir "${customerName}"? Esta ação é irreversível.`))
            return
        try {
            await apiClient.delete(`/customers/${customerId}`)

            // Melhora a UX: Em vez de apenas manipular o estado local, refaça o fetch para garantir a consistência
            // E lida com a lógica de paginação corretamente (voltar página se ficar vazia)
            const newTotal = total - 1;
            const newCustomersLength = customers.length - 1;

            // Se for o último item da página e não for a primeira página, volta uma página
            if (newCustomersLength === 0 && page > 1) {
                setPage(prev => prev - 1)
            } else {
                // Caso contrário, apenas refaz o fetch da página atual para obter a lista atualizada
                fetchCustomers({ page })
            }
            setTotal(newTotal);
            // setCustomers(prev => prev.filter(c => c.id !== customerId)) // (Opção mais rápida, mas menos segura para consistência)

        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao excluir cliente.')
        }
    }

    // render list (Mantido - OK)
    const renderCustomerList = () => {
        // ... (seu código de renderização do esqueleto/erro/lista)
        if (loading && customers.length === 0)
            return (
                <>
                    <CustomerSkeleton /><CustomerSkeleton /><CustomerSkeleton />
                </>
            )
        if (error)
            return (
                <li className='p-4 sm:px-6 text-red-600'>
                    <p>
                        <strong>Erro:</strong> {error}
                    </p>
                    <button
                        onClick={() => fetchCustomers({ page })}
                        className='mt-2 rounded-md bg-blue-50 py-1 px-3 text-sm text-blue-700'
                    >
                        Tentar Novamente
                    </button>
                </li>
            )
        if (customers.length === 0 && !loading)
            return (
                <li className='p-4 sm:px-6 text-gray-500'>
                    Nenhum cliente encontrado.
                </li>
            )

        return customers.map(customer => (
            <li
                key={customer.id}
                className='p-4 sm:px-6 hover:bg-gray-50 flex justify-between items-center'
            >
                <div className='flex-1 min-w-0 pr-4'>
                    <p className='text-md font-medium text-blue-700 truncate'>
                        {customer.name}
                    </p>
                    <p className='text-sm text-gray-600 truncate'>{customer.email}</p>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.status === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : customer.status === 'lead'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                    >
                        {customer.status}
                    </span>
                </div>
                <div className='flex items-center space-x-2'>
                    <button
                        onClick={() => handleEditClick(customer.id)}
                        title='Editar'
                        className='p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200'
                    >
                        <PencilSquareIcon className='w-5 h-5' />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(customer.id, customer.name)}
                        title='Excluir'
                        className='p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200'
                    >
                        <TrashIcon className='w-5 h-5' />
                    </button>
                </div>
            </li>
        ))
    }

    // Paginação
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const gotoPage = p => {
        if (p < 1 || p > totalPages) return
        setPage(p)
    }

    return (
        <Layout>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-3xl font-bold'>Seus Clientes</h1>
                <div className='flex items-center space-x-3'>
                    <input
                        placeholder='Buscar por nome ou email...'
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className='rounded-md border-gray-300 p-2'
                    />
                    <button
                        onClick={openCreateModal}
                        className='flex items-center rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white'
                    >
                        <PlusIcon className='w-4 h-4 mr-1' /> Novo Cliente
                    </button>
                </div>
            </div>

            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
                <ul className='divide-y divide-gray-200'>{renderCustomerList()}</ul>
            </div>

            {/* Pagination controls */}
            <div className='flex items-center justify-between mt-4'>
                <div className='text-sm text-gray-600'>
                    Mostrando página {page} de {totalPages} — {total} registros
                </div>
                <div className='flex items-center space-x-2'>
                    <button
                        onClick={() => gotoPage(page - 1)}
                        disabled={page === 1}
                        className='px-3 py-1 rounded border'
                    >
                        Anterior
                    </button>
                    <div className='hidden sm:flex items-center space-x-1'>
                        {/* Lógica de Paginação (Mantida - OK) */}
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let start = Math.max(1, Math.min(totalPages - 4, page - 2))
                            const p = start + i
                            if (p > totalPages) return null
                            return (
                                <button
                                    key={p}
                                    onClick={() => gotoPage(p)}
                                    className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'border'
                                        }`}
                                >
                                    {p}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        onClick={() => gotoPage(page + 1)}
                        disabled={page === totalPages}
                        className='px-3 py-1 rounded border'
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {/* MODAL AJUSTADO: Passando props e título dinâmico */}
            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                title={editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : 'Cadastrar Cliente'}
                size='lg'
            >
                {/* O CustomerForm agora recebe os dados iniciais e a função de submit */}
                <CustomerForm
                    initialData={editingCustomer}
                    onSubmit={handleSaveCustomer}
                    onClose={closeModal}
                    modalError={modalError}
                />
            </Modal>
        </Layout>
    )
}

export default CustomersPage
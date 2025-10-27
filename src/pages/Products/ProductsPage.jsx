import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Layout } from '../../components/Layout';
import { SlideOver } from '../../components/SlideOver';
import ProductForm from '../../components/ProductForm';
// Removido useNavigate pois não está sendo usado aqui
import {
    TrashIcon,
    PencilSquareIcon,
    PlusIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    ExclamationTriangleIcon // Adicionado para estoque baixo
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Componente Skeleton
const ProductSkeleton = () => (
    <li className='p-4 sm:px-6 animate-pulse'>
        <div className='h-4 bg-gray-200 rounded w-1/3'></div>
        <div className='h-3 bg-gray-200 rounded w-1/2 mt-2'></div>
    </li>
);

export const ProductsPage = () => {
    // --- Estados ---
    const { token, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Erro da lista principal
    // Paginação
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10); // Renomeado de perPage para clareza
    const [totalCount, setTotalCount] = useState(0);
    // Ordenação
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('asc');
    // Busca
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    // SlideOver (Modal Lateral)
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [modalError, setModalError] = useState(null); // Erro DENTRO do SlideOver/Form
    // Feedback
    const [successMessage, setSuccessMessage] = useState(null);

    // Calculado
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const lowStockThreshold = 10; // Limite para estoque baixo

    // --- Hooks e Funções ---

    // Cliente Axios memoizado
    const apiClient = useMemo(() => {
        return axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${token}` }
        });
    }, [token]);

    // Debounce para busca
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedQuery(query);
            setPage(1); // Volta para a página 1 ao buscar
        }, 400);
        return () => clearTimeout(t);
    }, [query]);

    // Função para buscar produtos (Corrigida)
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Limpa erro anterior
        try {
            const params = {
                q: debouncedQuery, // Parâmetro de busca
                page: page,        // Página atual
                limit: pageSize,   // Itens por página
                sortBy: sortBy,    // Campo de ordenação (CORRIGIDO: sem underscore)
                order: order       // Direção da ordenação
            };
            const response = await apiClient.get('/products', { params });

            // CORRIGIDO: Usa 'data' e 'total' conforme o backend
            setProducts(response.data.data || []);
            setTotalCount(response.data.total || 0);

        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao buscar produtos'); // Define erro da lista
            console.error("Erro ao buscar produtos:", err);
            if (err.response?.status === 401) logout();
        } finally {
            setIsLoading(false);
        }
        // Depende de todos os parâmetros que afetam a query
    }, [apiClient, logout, debouncedQuery, page, pageSize, sortBy, order]);

    // useEffect para buscar quando os parâmetros mudam
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // fetchProducts agora tem todas as dependências corretas

    // --- Funções do SlideOver/Modal ---
    const closeModal = () => {
        setIsSlideOverOpen(false);
        setEditingProduct(null);
        setModalError(null); // Limpa erro do modal ao fechar
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setModalError(null);
        setIsSlideOverOpen(true);
    };

    // --- Funções CRUD ---

    const handleEditClick = async (productId) => {
        setError(null); // Limpa erro da lista
        setModalError(null);
        // Idealmente, adicionar um loading *no botão* ou *dentro* do slide-over
        try {
            const response = await apiClient.get(`/products/${productId}`);
            const productData = response.data;
            // Formatar data aqui se ProductForm precisar (ex: se tivesse um campo date)
            setEditingProduct(productData);
            setIsSlideOverOpen(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao carregar dados do produto.');
            if (err.response?.status === 401) logout();
        }
    };

    const handleSaveProduct = async (formData) => {
        const isEditing = !!editingProduct?.id; // Checa se tem ID no objeto
        setModalError(null); // Limpa erro anterior do modal
        // Loading é gerenciado DENTRO do ProductForm via useForm
        try {
            const url = isEditing ? `/products/${editingProduct.id}` : '/products';
            const method = isEditing ? 'put' : 'post';

            await apiClient[method](url, formData);

            closeModal();
            fetchProducts(); // Re-busca a lista
            showSuccess(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        } catch (err) {
            // Define o erro a ser exibido DENTRO do modal
            setModalError(err.response?.data?.message || 'Erro ao salvar produto');
            // Não relança o erro, pois o useForm não está esperando
        }
    };

    const handleDelete = async (product) => { // Recebe o objeto produto
        if (!window.confirm(`Excluir o produto "${product.name}"?`)) return;
        try {
            await apiClient.delete(`/products/${product.id}`);
            // Lógica de paginação ao deletar (volta página se a atual ficar vazia)
            const newTotal = totalCount - 1;
            const newProductsLength = products.length - 1;
            if (newProductsLength === 0 && page > 1) {
                setPage(p => p - 1); // Dispara refetch pela mudança de página
            } else {
                fetchProducts(); // Apenas re-busca a página atual
            }
            setTotalCount(newTotal); // Atualiza o total (opcional, fetchProducts pode fazer isso)
            showSuccess(`Produto "${product.name}" excluído!`);
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao excluir produto');
            if (err.response?.status === 401) logout();
        }
    };

    // --- Funções Auxiliares ---
    const formatPrice = (cents) => { /* ... seu formatPrice ... */ };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // --- Funções de Paginação ---
    const prevPage = () => setPage((p) => Math.max(1, p - 1));
    const nextPage = () => setPage((p) => Math.min(totalPages, p + 1));

    // --- Funções de Ordenação ---
    const handleSort = (field) => {
        const newOrder = sortBy === field && order === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setOrder(newOrder);
        setPage(1); // Volta para a primeira página ao reordenar
    };


    // --- Renderização ---
    return (
        <Layout title="Produtos"> {/* Passando title para o Layout, se ele usar */}
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap">Seus Produtos</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                    <input
                        type="search"
                        placeholder="Buscar por nome ou SKU..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm p-2 w-full sm:w-64"
                    />
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center sm:justify-start rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 whitespace-nowrap w-full sm:w-auto"
                    >
                        <PlusIcon className='w-4 h-4 mr-1' /> Novo Produto
                    </button>
                </div>
            </div>

            {/* Mensagem de Sucesso */}
            {successMessage && (
                <div className="p-3 mb-4 rounded bg-green-100 text-green-800 text-sm transition-opacity duration-300" role="alert">
                    {successMessage}
                </div>
            )}

            {/* Lista de Produtos */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {/* Estado de Erro da Lista */}
                {error && (
                    <div className="p-4 sm:px-6 text-red-600">
                        <p><strong>Erro ao carregar produtos:</strong> {error}</p>
                        <button onClick={fetchProducts} className='mt-2 rounded-md bg-blue-50 py-1 px-3 text-sm text-blue-700'>
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Container da Lista (UL) */}
                <ul className="divide-y divide-gray-200">
                    {/* Cabeçalho Fixo (sm+) com Ordenação */}
                    <li className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-x-4 items-center px-4 sm:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {/* Adicionado cursor-pointer e onClick para ordenação */}
                        <div className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>Nome {sortBy === 'name' && (order === 'asc' ? '▲' : '▼')}</div>
                        <div className="text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('sku')}>SKU {sortBy === 'sku' && (order === 'asc' ? '▲' : '▼')}</div>
                        <div className="text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('stock_quantity')}>Estoque {sortBy === 'stock_quantity' && (order === 'asc' ? '▲' : '▼')}</div>
                        <div className="text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('price_cents')}>Preço {sortBy === 'price_cents' && (order === 'asc' ? '▲' : '▼')}</div>
                        <div className="text-right">Ações</div>
                    </li>

                    {/* Estado de Loading */}
                    {isLoading && products.length === 0 && (<> <ProductSkeleton /><ProductSkeleton /><ProductSkeleton /> </>)}

                    {/* Estado Vazio (após carregar) */}
                    {!isLoading && products.length === 0 && !error && (
                        <li className='p-4 sm:px-6 text-gray-500 text-center sm:col-span-5'> {/* Ajustado para lista */}
                            {debouncedQuery ? `Nenhum produto encontrado para "${debouncedQuery}".` : 'Nenhum produto cadastrado.'}
                        </li>
                    )}

                    {/* Linhas de Produto (com Grid Responsivo) */}
                    {!isLoading && products.length > 0 && products.map((product) => (
                        <li key={product.id} className="p-4 sm:px-6 hover:bg-gray-50">
                            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-x-4 gap-y-1 items-center">
                                {/* Col 1: Nome, Status, SKU(mobile), Preço(mobile) */}
                                <div className="truncate sm:col-span-1">
                                    <p className='text-md font-medium text-blue-700 truncate'>
                                        {product.name}
                                        {/* Badge de Status */}
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </p>
                                    <p className='text-xs text-gray-500 sm:hidden'>SKU: {product.sku || 'N/A'}</p>
                                    <p className='text-sm text-gray-600 sm:hidden mt-1'>{formatPrice(product.price_cents)}</p>
                                </div>
                                {/* Col 2: SKU (sm+) */}
                                <div className='hidden sm:block text-sm text-gray-500 truncate text-right'>{product.sku || 'N/A'}</div>
                                {/* Col 3: Estoque (sm+) */}
                                <div className='hidden sm:flex items-center justify-end text-sm text-gray-600'>
                                    {product.stock_quantity}
                                    {product.stock_quantity <= lowStockThreshold && (
                                        <ExclamationTriangleIcon title={`Estoque baixo (${product.stock_quantity})`} className="h-4 w-4 text-red-500 ml-1.5 shrink-0" />
                                    )}
                                </div>
                                {/* Col 4: Preço (sm+) */}
                                <div className='hidden sm:block text-sm text-gray-600 text-right'>{formatPrice(product.price_cents)}</div>
                                {/* Col 5: Ações */}
                                <div className='flex justify-end items-center space-x-1 sm:space-x-2 row-start-1 sm:row-start-auto col-start-2 sm:col-start-auto'>
                                    <button onClick={() => handleEditClick(product.id)} title='Editar' className='p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100'><PencilSquareIcon className='w-5 h-5' /></button>
                                    <button onClick={() => handleDelete(product)} title='Excluir' className='p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100'><TrashIcon className='w-5 h-5' /></button>
                                </div>
                                {/* Estoque (mobile, linha 2) */}
                                <div className='text-sm text-gray-600 sm:hidden col-start-1 row-start-2 flex items-center'>
                                    Estoque: {product.stock_quantity}
                                    {product.stock_quantity <= lowStockThreshold && (
                                        <ExclamationTriangleIcon title={`Estoque baixo (${product.stock_quantity})`} className="h-4 w-4 text-red-500 ml-1.5 shrink-0" />
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-y-3 px-4 sm:px-0">
                    <div className="text-sm text-gray-600">
                        Página {page} de {totalPages} ({totalCount} produtos)
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <button onClick={prevPage} disabled={page === 1} className="flex items-center px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-gray-100"> <ChevronLeftIcon className="w-4 h-4 mr-1" /> Anterior </button>
                        {/* Idealmente, adicionar números de página aqui se necessário */}
                        <span className="px-3 py-1 text-sm text-gray-500 hidden sm:inline">Pág {page}</span>
                        <button onClick={nextPage} disabled={page === totalPages} className="flex items-center px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-gray-100"> Próximo <ChevronRightIcon className="w-4 h-4 ml-1" /> </button>
                    </div>
                </div>
            )}

            {/* SlideOver (Corrigido para usar composição) */}
            <SlideOver
                isOpen={isSlideOverOpen}
                onClose={closeModal}
                title={editingProduct ? `Editar Produto: ${editingProduct?.name || ''}` : 'Cadastrar Produto'}
            >
                <ProductForm
                    initialData={editingProduct} // Passa os dados para o formulário
                    onSubmit={handleSaveProduct} // Passa a função de salvar
                    onCancel={closeModal}      // Passa a função de cancelar
                />
                {/* Exibe erro retornado pela API DENTRO do SlideOver */}
                {modalError && <p className="text-red-500 text-sm mt-4">{modalError}</p>}
            </SlideOver>

        </Layout>
    );
};
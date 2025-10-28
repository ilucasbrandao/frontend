import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Layout } from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const NewSalePage = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    // --- Estados do Formulário ---
    const [selectedCustomer, setSelectedCustomer] = useState(null); // Objeto do cliente selecionado
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // Produto sendo adicionado
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0); // Em centavos

    const [items, setItems] = useState([]); // Array de { product_id, name, quantity, unit_price_cents, total_price_cents }
    const [paymentMethod, setPaymentMethod] = useState('avista_dinheiro'); // Valor inicial
    const [installments, setInstallments] = useState(1); // Número de parcelas
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null); // Para feedback

    // --- Cliente Axios ---
    const apiClient = useMemo(() => axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    }), [token]);

    // --- Lógica de Busca (Simples com debounce manual) ---
    // Busca de Clientes
    useEffect(() => {
        if (customerSearch.length < 2) { // Só busca com 2+ caracteres
            setCustomerResults([]);
            setIsCustomerDropdownOpen(false);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const response = await apiClient.get('/customers', { params: { q: customerSearch, limit: 5 } }); // Pega só 5
                // Assumindo que a API retorna { data: [...] }
                setCustomerResults(response.data.data || []);
                setIsCustomerDropdownOpen(true);
            } catch (err) { console.error("Erro buscando clientes:", err); }
        }, 500); // 500ms debounce
        return () => clearTimeout(handler);
    }, [customerSearch, apiClient]);

    // Busca de Produtos
    useEffect(() => {
        if (productSearch.length < 2) {
            setProductResults([]);
            setIsProductDropdownOpen(false);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const response = await apiClient.get('/products', { params: { q: productSearch, limit: 5 } });
                // Assumindo que a API retorna { data: [...] }
                setProductResults(response.data.data || []);
                setIsProductDropdownOpen(true);
            } catch (err) { console.error("Erro buscando produtos:", err); }
        }, 500);
        return () => clearTimeout(handler);
    }, [productSearch, apiClient]);

    // --- Seleção ---
    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name); // Preenche input com nome
        setIsCustomerDropdownOpen(false); // Fecha dropdown
    };

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setProductSearch(product.name);
        setUnitPrice(product.price_cents); // Puxa preço padrão
        setIsProductDropdownOpen(false);
    };

    // --- Adicionar Item ---
    const addItem = () => {
        if (!selectedProduct || quantity <= 0 || unitPrice < 0) {
            alert("Selecione um produto válido e informe quantidade/preço.");
            return;
        }
        // Verifica se o produto já está na lista
        const existingItemIndex = items.findIndex(item => item.product_id === selectedProduct.id);

        let newItems;
        if (existingItemIndex > -1) {
            // Atualiza quantidade e recalcula total do item existente
            alert("Produto já adicionado. Edite a quantidade na lista (funcionalidade futura).");
            // TODO: Implementar edição de item na lista
            return; // Por agora, impede adicionar duplicado
            // newItems = [...items];
            // const currentItem = newItems[existingItemIndex];
            // currentItem.quantity += quantity;
            // currentItem.unit_price_cents = unitPrice; // Ou mantém o preço original? Decisão de negócio.
            // currentItem.total_price_cents = currentItem.quantity * currentItem.unit_price_cents;
        } else {
            // Adiciona novo item
            newItems = [...items, {
                product_id: selectedProduct.id,
                name: selectedProduct.name, // Guarda nome para exibição
                sku: selectedProduct.sku, // Guarda sku para exibição
                quantity: quantity,
                unit_price_cents: unitPrice,
                total_price_cents: quantity * unitPrice
            }];
        }

        setItems(newItems);

        // Limpa campos de adição de produto
        setSelectedProduct(null);
        setProductSearch('');
        setQuantity(1);
        setUnitPrice(0);
    };

    // --- Remover Item ---
    const removeItem = (productIdToRemove) => {
        setItems(prevItems => prevItems.filter(item => item.product_id !== productIdToRemove));
    };


    // --- Calcular Total ---
    const totalAmountCents = useMemo(() => {
        return items.reduce((sum, item) => sum + item.total_price_cents, 0);
    }, [items]);

    // --- Salvar Venda ---
    const handleSaveSale = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // Validações básicas
        if (!selectedCustomer) { setError("Selecione um cliente."); return; }
        if (items.length === 0) { setError("Adicione pelo menos um produto."); return; }
        if (paymentMethod === 'crediario' && installments <= 0) { setError("Informe um número válido de parcelas."); return; }

        setLoading(true);
        try {
            const saleData = {
                customer_id: selectedCustomer.id,
                items: items.map(item => ({ // Envia apenas os dados necessários
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price_cents: item.unit_price_cents
                })),
                payment_method: paymentMethod,
                notes: notes,
                number_of_installments: paymentMethod === 'crediario' ? installments : null
            };

            const response = await apiClient.post('/sales', saleData);

            setSuccessMessage(`Venda ${response.data.orderId} registrada com sucesso!`);
            // Limpar formulário após sucesso
            setSelectedCustomer(null);
            setCustomerSearch('');
            setItems([]);
            setPaymentMethod('avista_dinheiro');
            setInstallments(1);
            setNotes('');
            // Opcional: Redirecionar para lista de vendas
            // setTimeout(() => navigate('/sales'), 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar a venda.');
        } finally {
            setLoading(false);
        }
    };


    // --- Funções Auxiliares de Formatação ---
    const formatPrice = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    // --- Renderização ---
    return (
        <Layout>
            <form onSubmit={handleSaveSale}>
                <h1 className="text-2xl font-bold mb-6">Registrar Nova Venda</h1>

                {/* Mensagens de Feedback */}
                {error && <div className="p-3 mb-4 rounded bg-red-100 text-red-800 text-sm">{error}</div>}
                {successMessage && <div className="p-3 mb-4 rounded bg-green-100 text-green-800 text-sm">{successMessage}</div>}

                {/* --- Seção Cliente --- */}
                <div className="mb-6 bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-3">Cliente</h2>
                    <div className="relative">
                        <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
                        <input
                            id="customerSearch"
                            type="text"
                            value={customerSearch}
                            onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); /* Limpa seleção ao digitar */ }}
                            placeholder="Digite nome ou CPF/CNPJ..."
                            className="form-input block w-full rounded-md border-gray-300 shadow-sm"
                            disabled={loading}
                        />
                        {/* Dropdown de Resultados */}
                        {isCustomerDropdownOpen && customerResults.length > 0 && (
                            <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {customerResults.map(customer => (
                                    <li
                                        key={customer.id}
                                        onClick={() => selectCustomer(customer)}
                                        className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                                    >
                                        <span className="font-normal block truncate">{customer.name}</span>
                                        <span className="text-gray-500 ml-2">{customer.document_number}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {selectedCustomer && (
                            <p className="mt-2 text-sm text-green-700">Cliente selecionado: <strong>{selectedCustomer.name}</strong></p>
                        )}
                    </div>
                </div>

                {/* --- Seção Adicionar Produtos --- */}
                <div className="mb-6 bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-3">Adicionar Produto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        {/* Busca Produto */}
                        <div className="md:col-span-3 relative">
                            <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-1">Buscar Produto</label>
                            <input
                                id="productSearch"
                                type="text"
                                value={productSearch}
                                onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); setUnitPrice(0); }}
                                placeholder="Digite nome ou SKU..."
                                className="form-input block w-full rounded-md border-gray-300 shadow-sm"
                                disabled={loading}
                            />
                            {/* Dropdown de Resultados */}
                            {isProductDropdownOpen && productResults.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {productResults.map(product => (
                                        <li
                                            key={product.id}
                                            onClick={() => selectProduct(product)}
                                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                                        >
                                            <span className="font-normal block truncate">{product.name}</span>
                                            <span className="text-gray-500 ml-2">{formatPrice(product.price_cents)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {selectedProduct && (
                                <p className="mt-1 text-xs text-gray-600">Selecionado: {selectedProduct.name}</p>
                            )}
                        </div>
                        {/* Quantidade */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Qtd.</label>
                            <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                                min="1" step="1"
                                className="form-input block w-full rounded-md border-gray-300 shadow-sm text-right"
                                disabled={!selectedProduct || loading}
                            />
                        </div>
                        {/* Preço Unitário */}
                        <div>
                            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">Preço Unit. (R$)</label>
                            {/* Usar input formatado seria melhor aqui, mas simplificando */}
                            <input
                                id="unitPrice"
                                type="number" // Poderia ser text com formatação
                                value={(unitPrice / 100).toFixed(2)} // Exibe R$
                                onChange={(e) => setUnitPrice(Math.round(parseFloat(e.target.value.replace(',', '.')) * 100) || 0)} // Converte R$ para centavos
                                min="0" step="0.01"
                                className="form-input block w-full rounded-md border-gray-300 shadow-sm text-right"
                                disabled={!selectedProduct || loading}
                            />
                        </div>
                        {/* Botão Adicionar */}
                        <div>
                            <button
                                type="button"
                                onClick={addItem}
                                disabled={!selectedProduct || quantity <= 0 || loading}
                                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Seção Itens da Venda --- */}
                {items.length > 0 && (
                    <div className="mb-6 bg-white p-4 rounded shadow overflow-x-auto">
                        <h2 className="text-lg font-semibold mb-3">Itens na Venda</h2>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd.</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map(item => (
                                    <tr key={item.product_id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.name} <span className="text-xs text-gray-500">{item.sku ? `(${item.sku})` : ''}</span></td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatPrice(item.unit_price_cents)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatPrice(item.total_price_cents)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <button type="button" onClick={() => removeItem(item.product_id)} className="text-red-600 hover:text-red-900">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-gray-900 uppercase">Total</td>
                                    <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatPrice(totalAmountCents)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* --- Seção Pagamento --- */}
                <div className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="form-select block w-full rounded-md border-gray-300 shadow-sm"
                            disabled={loading}
                        >
                            <option value="avista_dinheiro">À Vista (Dinheiro)</option>
                            <option value="avista_pix">À Vista (PIX)</option>
                            <option value="avista_cartao">À Vista (Cartão)</option>
                            <option value="crediario">Crediário</option>
                        </select>
                    </div>
                    {/* Parcelas (condicional) */}
                    {paymentMethod === 'crediario' && (
                        <div>
                            <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">Nº de Parcelas</label>
                            <input
                                id="installments"
                                type="number"
                                value={installments}
                                onChange={(e) => setInstallments(Math.max(1, Number(e.target.value) || 1))}
                                min="1" step="1"
                                className="form-input block w-full rounded-md border-gray-300 shadow-sm text-right"
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>

                {/* --- Seção Observações --- */}
                <div className="mb-6 bg-white p-4 rounded shadow">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="form-textarea block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Detalhes adicionais sobre a venda..."
                        disabled={loading}
                    />
                </div>

                {/* --- Botão Salvar --- */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || items.length === 0 || !selectedCustomer}
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Venda'}
                    </button>
                </div>

            </form>
        </Layout>
    );
};
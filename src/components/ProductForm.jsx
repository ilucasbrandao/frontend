import React, { useEffect, useState } from 'react';
import useForm from '../hooks/useForm.js'; // Garanta que a extensão esteja correta (.js ou .jsx)

// --- 1. ATUALIZAR ESTADO INICIAL ---
const INITIAL_FORM_STATE = {
    name: '',
    sku: '', // <-- NOVO
    category: '', // <-- NOVO (Campo de texto simples por agora)
    unit_of_measure: 'un', // <-- NOVO (Default: Unidade)
    price_cents: 0,
    cost_price_cents: 0, // <-- NOVO
    stock_quantity: 0, // <-- NOVO
    status: 'active', // <-- NOVO
    description: '', // <-- NOVO
};

// --- 2. ATUALIZAR VALIDAÇÃO ---
const validateProduct = (formData) => {
    const errors = {};

    // Nome
    if (!formData.name || formData.name.trim().length < 3) {
        errors.name = 'Nome é obrigatório (mínimo 3 caracteres).';
    }

    // Preço de Venda
    if (formData.price_cents === null || formData.price_cents === undefined || isNaN(formData.price_cents) || formData.price_cents < 0 || !Number.isInteger(formData.price_cents)) {
        errors.price_cents = 'Preço de Venda deve ser um número inteiro positivo (em centavos).';
    }

    // Preço de Custo
    if (formData.cost_price_cents === null || formData.cost_price_cents === undefined || isNaN(formData.cost_price_cents) || formData.cost_price_cents < 0 || !Number.isInteger(formData.cost_price_cents)) {
        errors.cost_price_cents = 'Preço de Custo deve ser um número inteiro positivo (em centavos).';
    }

    // Estoque
    const stockValue = formData.stock_quantity !== '' && formData.stock_quantity !== null ? Number(formData.stock_quantity) : null;
    if (stockValue === null || isNaN(stockValue) || stockValue < 0 || !Number.isInteger(stockValue)) {
        errors.stock_quantity = 'Estoque deve ser um número inteiro não negativo.';
    }

    // Unidade de Medida (Opcional, mas pode validar se não estiver vazio)
    if (!formData.unit_of_measure) {
        errors.unit_of_measure = 'Unidade de medida é recomendada.';
    }


    return errors;
};

// --- COMPONENTE DO FORMULÁRIO ---
export default function ProductForm({ onSubmit, onCancel, initialData = null }) {
    const {
        formData,
        handleChange,
        setFormValue,
        resetForm,
        loading, // Loading do useForm (usado para submit agora)
        error, // Erro geral do submit vindo do useForm
        validationErrors,
        handleSubmit, // Wrapper de submit do useForm
        // Removido setLoading e setError locais, use os do useForm
    } = useForm(INITIAL_FORM_STATE, initialData, validateProduct);

    // Estados para exibição formatada de preços
    const [displayPrice, setDisplayPrice] = useState('');
    const [displayCostPrice, setDisplayCostPrice] = useState(''); // <-- NOVO

    // --- 3. ATUALIZAR useEffect para initialData ---
    useEffect(() => {
        if (initialData) {
            // Limpa dados antigos e preenche com os novos
            const dataToSet = { ...INITIAL_FORM_STATE, ...initialData };
            resetForm(dataToSet);
            // Formata preços para exibição
            setDisplayPrice(
                initialData.price_cents != null ? (initialData.price_cents / 100).toFixed(2).replace('.', ',') : ''
            );
            setDisplayCostPrice(
                initialData.cost_price_cents != null ? (initialData.cost_price_cents / 100).toFixed(2).replace('.', ',') : ''
            );
        } else {
            // Modo Criação: Reseta para o estado inicial padrão
            resetForm(INITIAL_FORM_STATE);
            setDisplayPrice('');
            setDisplayCostPrice('');
        }
        // resetForm deve estar memoizado no useForm para segurança
    }, [initialData, resetForm]);

    // --- 4. FUNÇÕES DE FORMATAÇÃO DE PREÇO (unificadas) ---
    const handleCurrencyChange = (e, fieldName, setDisplayFn) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove não dígitos
        let numValue = 0;

        if (value) {
            numValue = parseInt(value, 10);
            setDisplayFn((numValue / 100).toFixed(2).replace('.', ','));
        } else {
            setDisplayFn('');
        }
        // Atualiza o valor em centavos no formData
        setFormValue(fieldName, numValue);
    };

    // --- Classes Tailwind ---
    const formInputClasses = 'form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 disabled:bg-gray-100';
    const formLabelClasses = 'block text-sm font-medium text-gray-700 mb-1';
    const formSelectClasses = 'form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5';
    const formTextareaClasses = 'form-textarea block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5';
    const btnPrimaryClasses = 'inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50';
    const btnSecondaryClasses = 'inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50';

    return (
        // handleSubmit do useForm lida com preventDefault, validação e loading/error
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* --- Seção Principal --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Nome */}
                <div className="md:col-span-2">
                    <label htmlFor="name" className={formLabelClasses}>Nome do Produto *</label>
                    <input id="name" name="name" value={formData.name} onChange={handleChange} required className={formInputClasses} />
                    {validationErrors.name && <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>}
                </div>

                {/* SKU */}
                <div>
                    <label htmlFor="sku" className={formLabelClasses}>SKU (Código)</label>
                    <input id="sku" name="sku" value={formData.sku || ''} onChange={handleChange} className={formInputClasses} placeholder="Ex: CAM-AZUL-P" />
                    {validationErrors.sku && <p className="mt-1 text-xs text-red-600">{validationErrors.sku}</p>}
                </div>

                {/* Categoria */}
                <div>
                    <label htmlFor="category" className={formLabelClasses}>Categoria</label>
                    <input id="category" name="category" value={formData.category || ''} onChange={handleChange} className={formInputClasses} placeholder="Ex: Camisetas" />
                    {/* Pode trocar por <select> se tiver categorias predefinidas */}
                    {validationErrors.category && <p className="mt-1 text-xs text-red-600">{validationErrors.category}</p>}
                </div>

                {/* Unidade de Medida */}
                <div>
                    <label htmlFor="unit_of_measure" className={formLabelClasses}>Unidade *</label>
                    <select id="unit_of_measure" name="unit_of_measure" value={formData.unit_of_measure} onChange={handleChange} required className={formSelectClasses}>
                        <option value="un">Unidade (un)</option>
                        <option value="pc">Peça (pç)</option>
                        <option value="cx">Caixa (cx)</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="l">Litro (l)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="m">Metro (m)</option>
                        <option value="m2">Metro Quadrado (m²)</option>
                        {/* Adicione outras unidades conforme necessário */}
                    </select>
                    {validationErrors.unit_of_measure && <p className="mt-1 text-xs text-red-600">{validationErrors.unit_of_measure}</p>}
                </div>

                {/* Status */}
                <div>
                    <label htmlFor="status" className={formLabelClasses}>Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className={formSelectClasses} >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                    {validationErrors.status && <p className="mt-1 text-xs text-red-600">{validationErrors.status}</p>}
                </div>
            </div>

            {/* --- Seção de Preços e Estoque --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 border-t border-gray-200 pt-6">
                {/* Preço de Custo */}
                <div>
                    <label htmlFor="cost_price_cents" className={formLabelClasses}>Preço de Custo (R$) *</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                        <input
                            type="text"
                            name="cost_price_cents_display" // Nome diferente para o input formatado
                            id="cost_price_cents"
                            value={displayCostPrice}
                            onChange={(e) => handleCurrencyChange(e, 'cost_price_cents', setDisplayCostPrice)}
                            className={`${formInputClasses} pl-10 pr-4 text-right`} // Alinhado à direita
                            placeholder="0,00"
                            required
                        />
                    </div>
                    {validationErrors.cost_price_cents && <p className="mt-1 text-xs text-red-600">{validationErrors.cost_price_cents}</p>}
                </div>

                {/* Preço de Venda */}
                <div>
                    <label htmlFor="price_cents" className={formLabelClasses}>Preço de Venda (R$) *</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                        <input
                            type="text"
                            name="price_cents_display" // Nome diferente
                            id="price_cents"
                            value={displayPrice}
                            onChange={(e) => handleCurrencyChange(e, 'price_cents', setDisplayPrice)}
                            className={`${formInputClasses} pl-10 pr-4 text-right`} // Alinhado à direita
                            placeholder="0,00"
                            required
                        />
                    </div>
                    {validationErrors.price_cents && <p className="mt-1 text-xs text-red-600">{validationErrors.price_cents}</p>}
                </div>

                {/* Estoque */}
                <div>
                    <label htmlFor="stock_quantity" className={formLabelClasses}>Estoque Atual *</label>
                    <input
                        type="number"
                        id="stock_quantity"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleChange}
                        min="0" step="1" required
                        className={`${formInputClasses} text-right`} // Alinhado à direita
                    />
                    {validationErrors.stock_quantity && <p className="mt-1 text-xs text-red-600">{validationErrors.stock_quantity}</p>}
                </div>
            </div>

            {/* --- Seção Descrição --- */}
            <div className="border-t border-gray-200 pt-6">
                <label htmlFor="description" className={formLabelClasses}>Descrição / Observações</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={4}
                    className={formTextareaClasses}
                    placeholder="Detalhes adicionais sobre o produto..."
                />
                {validationErrors.description && <p className="mt-1 text-xs text-red-600">{validationErrors.description}</p>}
            </div>

            {/* Erro Geral da API (vindo do useForm via onSubmit) */}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className={btnSecondaryClasses}>
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className={btnPrimaryClasses}>
                    {/* Usa o 'loading' do useForm que é ativado pelo handleSubmit */}
                    {loading ? (initialData ? 'Atualizando...' : 'Salvando...') : (initialData ? 'Atualizar Produto' : 'Salvar Produto')}
                </button>
            </div>
        </form>
    );
}
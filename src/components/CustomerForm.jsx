import React, { useEffect, useState } from "react";
import useForm from "../hooks/useForm.js"; // Verifique se a extensão está correta (.js ou .jsx)
import axios from "axios";

// Estado inicial do formulário (sem mudanças)
const INITIAL_FORM_STATE = {
    name: "",
    email: "",
    phone: "",
    document_type: "PF",
    document_number: "",
    birth_date: "",
    status: "ativo",
    address_zip_code: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    notes: "",
};

// Funções de máscara (sem mudanças)
const formatPhone = (v = "") => {
    const d = v.replace(/\D/g, "");
    if (d.length <= 10)
        return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (m, a, b, c) =>
            c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : `(${a}`
        );
    return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};
const formatCPF = (v = "") =>
    v
        .replace(/\D/g, "")
        .replace(
            /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
            (m, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ""}`
        );
const formatCNPJ = (v = "") =>
    v
        .replace(/\D/g, "")
        .replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
            (m, a, b, c, d, e) => `${a}.${b}.${c}/${d}${e ? `-${e}` : ""}`
        );

// Função de validação (movida para fora para clareza)
const validateCustomer = (formData) => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 3)
        errors.name = "Nome é obrigatório (mínimo 3 caracteres).";
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
        errors.email = "Email inválido.";
    if (
        formData.document_type === "PF" &&
        formData.document_number &&
        formData.document_number.replace(/\D/g, "").length !== 11
    )
        errors.document_number = "CPF inválido.";
    if (
        formData.document_type === "PJ" &&
        formData.document_number &&
        formData.document_number.replace(/\D/g, "").length !== 14
    )
        errors.document_number = "CNPJ inválido.";
    // Adicione outras validações se necessário (CEP, Data, etc.)
    return errors;
};

export default function CustomerForm({
    onSubmit,
    onCancel,
    initialData = null,
}) {
    // --- USA o useForm CORRETAMENTE ---
    const {
        formData,
        handleChange,
        setFormValue,
        resetForm,
        loading, // Gerenciado pelo handleSubmit do useForm
        setLoading, // Para ViaCEP
        error, // Erro de Submit/API (do handleSubmit) ou ViaCEP
        setError, // Para ViaCEP
        validationErrors, // Erros locais dos campos
        handleSubmit, // <-- Wrapper de submit do useForm (ESSENCIAL)
    } = useForm(INITIAL_FORM_STATE, initialData, validateCustomer); // Passa a função de validação

    // useEffect [initialData] com formatação de data
    useEffect(() => {
        if (initialData) {
            const cleanData = { ...INITIAL_FORM_STATE, ...initialData };
            // Formata data
            if (cleanData.birth_date && typeof cleanData.birth_date === "string") {
                cleanData.birth_date = cleanData.birth_date.split("T")[0];
            } else {
                cleanData.birth_date = ""; // Garante string vazia
            }
            resetForm(cleanData); // Popula o formulário
        } else {
            resetForm(INITIAL_FORM_STATE); // Limpa para criação
        }
        // Adicione resetForm às dependências se ele for memoizado (useCallback) no useForm
    }, [initialData, resetForm]);

    // VIA CEP (OK)
    const handleZipCodeBlur = async (e) => {
        const zipCode = (e.target.value || "").replace(/\D/g, "");
        if (!zipCode || zipCode.length !== 8) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(
                `https://viacep.com.br/ws/${zipCode}/json/`
            );
            if (data?.erro) {
                setError("CEP não encontrado");
            } else {
                setFormValue("address_street", data.logradouro || "");
                setFormValue("address_neighborhood", data.bairro || "");
                setFormValue("address_city", data.localidade || "");
                setFormValue("address_state", data.uf || "");
                setTimeout(
                    () => document.getElementsByName("address_number")[0]?.focus(),
                    0
                );
            }
        } catch (err) {
            setError(err?.message || "Erro ao consultar o CEP.");
        } finally {
            setLoading(false);
        }
    };

    // Máscaras (OK)
    useEffect(() => {
        if (formData.phone != null) {
            const formattedPhone = formatPhone(formData.phone);
            if (formattedPhone !== formData.phone) {
                setFormValue("phone", formattedPhone);
            }
        }
    }, [formData.phone, setFormValue]);

    useEffect(() => {
        if (formData.document_number != null) {
            const formatter =
                formData.document_type === "PF" ? formatCPF : formatCNPJ;
            const formattedDocument = formatter(formData.document_number);
            if (formattedDocument !== formData.document_number) {
                setFormValue("document_number", formattedDocument);
            }
        }
    }, [formData.document_type, formData.document_number, setFormValue]);

    // --- Classes Tailwind ---
    const formInputClasses =
        "form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed";
    const formLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
    const formSelectClasses =
        "form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed";
    const formTextareaClasses =
        "form-textarea block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed";
    const btnPrimaryClasses =
        "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition";
    const btnSecondaryClasses =
        "inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50";

    // --- Renderização ---
    return (
        // Usa handleSubmit do useForm, que chama a validação e depois o onSubmit (prop)
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <div>
                <label htmlFor="name" className={formLabelClasses}>
                    Nome Completo *
                </label>
                <input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                    className={formInputClasses}
                    disabled={loading}
                />
                {validationErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                )}
            </div>

            {/* Email + Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className={formLabelClasses}>
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className={formInputClasses}
                        disabled={loading}
                    />
                    {validationErrors.email && (
                        <p className="mt-1 text-xs text-red-600">
                            {validationErrors.email}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="phone" className={formLabelClasses}>
                        Telefone
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className={formInputClasses}
                        disabled={loading}
                    />
                    {/* Adicionar validationErrors.phone se houver validação */}
                </div>
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="document_type" className={formLabelClasses}>
                        Tipo
                    </label>
                    <select
                        id="document_type"
                        name="document_type"
                        value={formData.document_type}
                        onChange={handleChange}
                        className={formSelectClasses}
                        disabled={loading}
                    >
                        <option value="PF">CPF</option>
                        <option value="PJ">CNPJ</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="document_number" className={formLabelClasses}>
                        {formData.document_type === "PF" ? "CPF" : "CNPJ"}
                    </label>
                    <input
                        id="document_number"
                        name="document_number"
                        value={formData.document_number || ""}
                        onChange={handleChange}
                        placeholder={
                            formData.document_type === "PF"
                                ? "000.000.000-00"
                                : "00.000.000/0001-00"
                        }
                        className={formInputClasses}
                        disabled={loading}
                    />
                    {validationErrors.document_number && (
                        <p className="mt-1 text-xs text-red-600">
                            {validationErrors.document_number}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="birth_date" className={formLabelClasses}>
                        Data de Nascimento
                    </label>
                    <input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        value={formData.birth_date || ""}
                        onChange={handleChange}
                        className={formInputClasses}
                        disabled={loading}
                    />
                    {/* Adicionar validationErrors.birth_date se houver */}
                </div>
            </div>

            {/* ENDEREÇO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6 mt-6 border-gray-200">
                <h3 className="col-span-full text-lg font-semibold text-gray-900 -mt-2">
                    Endereço
                </h3>
                <div>
                    <label htmlFor="address_zip_code" className={formLabelClasses}>
                        CEP
                    </label>
                    <input
                        id="address_zip_code"
                        name="address_zip_code"
                        value={formData.address_zip_code || ""}
                        onChange={handleChange}
                        onBlur={handleZipCodeBlur}
                        className={formInputClasses}
                        disabled={loading}
                    />
                    {/* Pode adicionar validationErrors.address_zip_code */}
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address_street" className={formLabelClasses}>
                        Rua
                    </label>
                    <input
                        id="address_street"
                        name="address_street"
                        value={formData.address_street || ""}
                        onChange={handleChange}
                        readOnly={loading}
                        className={formInputClasses}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="address_number" className={formLabelClasses}>
                        Número
                    </label>
                    <input
                        id="address_number"
                        name="address_number"
                        value={formData.address_number || ""}
                        onChange={handleChange}
                        className={formInputClasses}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="address_complement" className={formLabelClasses}>
                        Complemento
                    </label>
                    <input
                        id="address_complement"
                        name="address_complement"
                        value={formData.address_complement || ""}
                        onChange={handleChange}
                        className={formInputClasses}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="address_neighborhood" className={formLabelClasses}>
                        Bairro
                    </label>
                    <input
                        id="address_neighborhood"
                        name="address_neighborhood"
                        value={formData.address_neighborhood || ""}
                        onChange={handleChange}
                        readOnly={loading}
                        className={formInputClasses}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="address_city" className={formLabelClasses}>
                        Cidade
                    </label>
                    <input
                        id="address_city"
                        name="address_city"
                        value={formData.address_city || ""}
                        onChange={handleChange}
                        readOnly={loading}
                        className={formInputClasses}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="address_state" className={formLabelClasses}>
                        UF
                    </label>
                    <input
                        id="address_state"
                        name="address_state"
                        value={formData.address_state || ""}
                        onChange={handleChange}
                        maxLength={2}
                        readOnly={loading}
                        className={formInputClasses}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Observação */}
            <div>
                <label htmlFor="notes" className={formLabelClasses}>
                    Observações
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    rows={3}
                    className={formTextareaClasses}
                    disabled={loading}
                />
            </div>

            {/* Exibe o erro de submit/API vindo do useForm */}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
                {/* Botão Cancelar chama onCancel (prop) */}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className={btnSecondaryClasses}
                >
                    Cancelar
                </button>

                {/* Botão Submit usa 'loading' do useForm */}
                <button type="submit" disabled={loading} className={btnPrimaryClasses}>
                    {loading
                        ? "Salvando..."
                        : initialData
                            ? "Atualizar Cliente"
                            : "Salvar Cliente"}
                </button>
            </div>
        </form>
    );
}

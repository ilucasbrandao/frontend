import React, { useEffect, useState } from 'react'
import useForm from '../hooks/useForm.js'
import axios from 'axios'

// Estado inicial do formulário
const INITIAL_FORM_STATE = {
    name: '',
    email: '',
    phone: '',
    document_type: 'PF',
    document_number: '',
    birth_date: '',
    status: 'ativo',
    address_zip_code: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    notes: ''
}

// Funções de formatação (máscaras)
const formatPhone = (v = '') => {
    const d = v.replace(/\D/g, '')
    if (d.length <= 10)
        return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (m, a, b, c) =>
            c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : `(${a}`
        )
    return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

const formatCPF = (v = '') =>
    v
        .replace(/\D/g, '')
        .replace(
            /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
            (m, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ''}`
        )
const formatCNPJ = (v = '') =>
    v
        .replace(/\D/g, '')
        .replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
            (m, a, b, c, d, e) => `${a}.${b}.${c}/${d}${e ? `-${e}` : ''}`
        )

export default function CustomerForm({ onSubmit, onCancel, initialData = null }) {
    const {
        formData,
        handleChange,
        setFormValue,
        resetForm,
        loading,
        setLoading,
        error,
        setError
    } = useForm(INITIAL_FORM_STATE, initialData);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Sincroniza os dados quando abrimos para editar
            resetForm(initialData);
        }
    }, [initialData]);

    // VIA CEP
    const handleZipCodeBlur = async e => {
        const zipCode = (e.target.value || '').replace(/\D/g, '')
        if (!zipCode || zipCode.length !== 8) return
        setLoading(true)
        setError(null)
        try {
            const { data } = await axios.get(
                `https://viacep.com.br/ws/${zipCode}/json/`
            )
            if (data?.erro) {
                setError('CEP não encontrado')
            } else {
                setFormValue('address_street', data.logradouro || '')
                setFormValue('address_neighborhood', data.bairro || '')
                setFormValue('address_city', data.localidade || '')
                setFormValue('address_state', data.uf || '')
                // foco no número
                setTimeout(
                    () => document.getElementsByName('address_number')[0]?.focus(),
                    0
                )
            }
        } catch (err) {
            // Tratamento de erro de rede ou outro.
            setError(err?.message || 'Erro ao consultar o CEP.');
        } finally {
            setLoading(false)
        }
    }

    // Máscara para telefone. Adicionada verificação de diferença para prevenir loop.
    useEffect(() => {
        if (formData.phone != null) {
            const formattedPhone = formatPhone(formData.phone);
            // Chama setFormValue APENAS se o valor realmente mudou após a máscara
            if (formattedPhone !== formData.phone) {
                setFormValue('phone', formattedPhone);
            }
        }
    }, [formData.phone, setFormValue])

    // Máscara para documento. Adicionada verificação de diferença para prevenir loop.
    useEffect(() => {
        if (formData.document_number != null) {
            const formatter = formData.document_type === 'PF' ? formatCPF : formatCNPJ;
            const formattedDocument = formatter(formData.document_number);

            // Chama setFormValue APENAS se o valor realmente mudou após a máscara
            if (formattedDocument !== formData.document_number) {
                setFormValue('document_number', formattedDocument);
            }
        }
    }, [
        formData.document_type,
        formData.document_number,
        setFormValue
    ])


    // Validação leve antes do submit
    const validate = () => {
        if (!formData.name || formData.name.trim().length < 3)
            return 'Nome é obrigatório e deve ter ao menos 3 caracteres.'
        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
            return 'Email inválido.'
        if (
            formData.document_type === 'PF' &&
            formData.document_number &&
            formData.document_number.replace(/\D/g, '').length !== 11
        )
            return 'CPF inválido.'
        if (
            formData.document_type === 'PJ' &&
            formData.document_number &&
            formData.document_number.replace(/\D/g, '').length !== 14
        )
            return 'CNPJ inválido.'
        return null
    }

    const submit = async e => {
        e.preventDefault()
        setError(null)
        const v = validate()
        if (v) {
            setError(v)
            return
        }
        setIsSubmitting(true)
        try {
            // AQUI IRÁ O CÓDIGO DO PAI, ENVIANDO PARA O BACKEND
            await onSubmit(formData)
        } catch (err) {
            setError(err?.message || 'Erro ao salvar cliente')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Classes Tailwind customizadas (Assumindo que estão em uso no projeto)
    const formInputClasses = 'form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5'
    const formLabelClasses = 'block text-sm font-medium text-gray-700 mb-1'
    const btnPrimaryClasses = 'inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition'
    const btnSecondaryClasses = 'inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition'

    return (
        <form onSubmit={submit} className='space-y-6'>
            {/* Nome */}
            <div>
                <label htmlFor='name' className={formLabelClasses}>
                    Nome Completo *
                </label>
                <input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={formInputClasses}
                />
            </div>

            {/* Email + Telefone */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className={formLabelClasses}>Email</label>
                    <input
                        name='email'
                        type='email'
                        value={formData.email}
                        onChange={handleChange}
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>Telefone</label>
                    <input
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder='(88) 9.9999-9999'
                        className={formInputClasses}
                    />
                </div>
            </div>

            {/* Documento */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div>
                    <label className={formLabelClasses}>Tipo</label>
                    <select
                        name='document_type'
                        value={formData.document_type}
                        onChange={handleChange}
                        className={formInputClasses}
                    >
                        <option value='PF'>CPF</option>
                        <option value='PJ'>CNPJ</option>
                    </select>
                </div>

                <div>
                    <label className={formLabelClasses}>
                        {formData.document_type === 'PF' ? 'CPF' : 'CNPJ'}
                    </label>
                    <input
                        name='document_number'
                        value={formData.document_number}
                        onChange={handleChange}
                        placeholder={
                            formData.document_type === 'PF'
                                ? '000.000.000-00'
                                : '00.000.000/0001-00'
                        }
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>Data de Nascimento</label>
                    <input
                        name='birth_date'
                        type='date'
                        value={formData.birth_date}
                        onChange={handleChange}
                        className={formInputClasses}
                    />
                </div>
            </div>

            {/* ENDEREÇO */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6 mt-6 border-gray-200'>
                <h3 className='col-span-full text-lg font-semibold text-gray-900 -mt-2'>Endereço</h3>
                <div>
                    <label className={formLabelClasses}>CEP</label>
                    <input
                        name='address_zip_code'
                        value={formData.address_zip_code}
                        onChange={handleChange}
                        onBlur={handleZipCodeBlur}
                        className={formInputClasses}
                    />
                </div>

                <div className='md:col-span-2'>
                    <label className={formLabelClasses}>Rua</label>
                    <input
                        name='address_street'
                        value={formData.address_street}
                        onChange={handleChange}
                        readOnly={loading}
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>Número</label>
                    <input
                        name='address_number'
                        value={formData.address_number}
                        onChange={handleChange}
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>Complemento</label>
                    <input
                        name='address_complement'
                        value={formData.address_complement}
                        onChange={handleChange}
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>Bairro</label>
                    <input
                        name='address_neighborhood'
                        value={formData.address_neighborhood}
                        onChange={handleChange}
                        readOnly={loading}
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>Cidade</label>
                    <input
                        name='address_city'
                        value={formData.address_city}
                        onChange={handleChange}
                        readOnly={loading}
                        className={formInputClasses}
                    />
                </div>

                <div>
                    <label className={formLabelClasses}>UF</label>
                    <input
                        name='address_state'
                        value={formData.address_state}
                        onChange={handleChange}
                        maxLength={2}
                        readOnly={loading}
                        className={formInputClasses}
                    />
                </div>
            </div>

            {/* Observação */}
            <div>
                <label className={formLabelClasses}>Observações</label>
                <textarea
                    name='notes'
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className={formInputClasses}
                />
            </div>

            {error && <p className='text-sm text-red-600'>{error}</p>}

            {/* Botões */}
            <div className='flex justify-end space-x-3 pt-4'>
                <button type='button' onClick={onCancel} className={btnSecondaryClasses}>
                    Cancelar
                </button>

                <button
                    type='submit'
                    disabled={isSubmitting || loading}
                    className={btnPrimaryClasses}
                >
                    {isSubmitting
                        ? 'Salvando...'
                        : initialData
                            ? 'Atualizar Cliente'
                            : 'Salvar Cliente'}
                </button>
            </div>
        </form>
    )
}


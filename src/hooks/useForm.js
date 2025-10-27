// src/hooks/useForm.js
import { useState, useEffect, useCallback } from "react";

/**
 * Hook customizado para gerenciar estado, mudanças e submissão de formulários.
 *
 * @param {object} initialState - O estado inicial do formulário.
 * @param {object | null} initialData - Dados iniciais para modo de edição (opcional).
 * @param {function} validationFn - Função para validação local: (formData) => { [campo]: 'Erro' }
 */
const useForm = (
  initialState,
  initialData = null,
  validationFn = () => ({})
) => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({}); // NOVO: Erros de validação local // Sincroniza quando initialData muda (modo edição)

  useEffect(() => {
    if (initialData) {
      const cleanData = { ...initialData }; // Limpeza e formatação de data para input[type="date"]
      if (cleanData.birth_date && typeof cleanData.birth_date === "string") {
        cleanData.birth_date = cleanData.birth_date.split("T")[0];
      }
      setFormData(cleanData);
    } else {
      setFormData(initialState);
    }
    setValidationErrors({}); // Limpa erros ao mudar dados iniciais // Nota: 'initialState' é omitido das dependências, // assumindo que é uma constante ou um objeto memoizado na função chamadora. // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const val = type === "checkbox" ? checked : value;
      setFormData((prev) => {
        const newState = { ...prev, [name]: val };

        // Validação instantânea: executa a função de validação no novo estado
        const newErrors = validationFn(newState);

        // Atualiza os erros de validação apenas para o campo que mudou (ou limpa se válido)
        if (newErrors[name]) {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [name]: newErrors[name],
          }));
        } else {
          setValidationErrors((prevErrors) => {
            const { [name]: removed, ...rest } = prevErrors;
            return rest;
          });
        }
        return newState;
      });
    },
    [validationFn]
  );

  const setFormValue = useCallback(
    (name, value) => {
      setFormData((prev) => {
        // 1. Cria o novo estado a partir do estado anterior ('prev')
        const newState = { ...prev, [name]: value };

        // 2. Roda a validação no estado FRESCO
        const newErrors = validationFn(newState);
        if (newErrors[name]) {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [name]: newErrors[name],
          }));
        } else {
          setValidationErrors((prevErrors) => {
            const { [name]: removed, ...rest } = prevErrors;
            return rest;
          });
        }

        // 3. Retorna o novo estado
        return newState;
      });
    },
    [validationFn]
  ); // 'formData' não é mais necessário como dependência

  const resetForm = useCallback(
    (data = initialState) => {
      setFormData(data);
      setValidationErrors({});
    },
    [initialState]
  );

  /**
   * Função que envelopa a submissão, executando a validação antes.
   * @param {function} callback - Função assíncrona a ser chamada em caso de sucesso (Ex: API call).
   */
  const handleSubmit = useCallback(
    (callback) => async (e) => {
      if (e && e.preventDefault) e.preventDefault(); // 1. Validação
      const errors = validationFn(formData);
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        setError("Por favor, corrija os erros no formulário.");
        return; // Para a submissão se houver erros de validação
      } // 2. Submissão

      setLoading(true);
      setError(null); // Limpa erros anteriores de API
      try {
        await callback(formData);
      } catch (submitError) {
        // Assume que o erro de submit é um erro de API
        setError(
          submitError.response?.data?.message ||
            "Erro ao processar sua solicitação."
        );
        throw submitError; // Rejeita a promessa para que o chamador também possa tratar
      } finally {
        setLoading(false);
      }
    },
    [formData, validationFn]
  );

  return {
    formData,
    setFormValue,
    setFormData, // Você retorna o setter do formData
    handleChange,
    resetForm,
    loading, // Você retorna o valor do loading
    setLoading, // <-- ADICIONE ESTA LINHA para retornar a função setter
    error, // Você retorna o valor do error
    setError, // Você retorna o setter do error
    validationErrors,
    handleSubmit,
  };
};

export default useForm;

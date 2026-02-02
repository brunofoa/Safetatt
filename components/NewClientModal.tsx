import React, { useState } from 'react';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentStudio } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        cpf: '',
        rg: '',
        profession: '',
        email: '',
        phone: '',
        instagram: '',
        zipCode: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.phone) {
            alert('Por favor, preencha pelo menos Nome e Telefone.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await clientService.createClient({ ...formData, studioId: currentStudio?.id });
            if (result.success) {
                // Clear form? Or keep it? Let's clear for now or just close
                setFormData({
                    firstName: '', lastName: '', birthDate: '', cpf: '', rg: '', profession: '',
                    email: '', phone: '', instagram: '', zipCode: '', street: '', number: '',
                    neighborhood: '', city: '', state: ''
                });
                onClose();
                if (onSuccess) onSuccess();
            } else {
                alert('Erro ao salvar cliente: ' + (result.error?.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao processar a solicitação.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Novo Cliente</h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Preencha os dados completos para o cadastro</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-8">

                        {/* 1. Dados Pessoais */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Dados Pessoais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Row 1: Name & Surname */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Nome</label>
                                    <input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Primeiro nome"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Sobrenome</label>
                                    <input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Sobrenome completo"
                                        className="input-field w-full"
                                    />
                                </div>

                                {/* Row 2: CPF & BirthDate */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">CPF</label>
                                    <input
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Data de Nascimento</label>
                                    <input
                                        name="birthDate"
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                        type="date"
                                        className="input-field w-full"
                                    />
                                </div>

                                {/* Row 3: Phone (Moved up) & RG */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Celular / WhatsApp</label>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">RG / Passaporte</label>
                                    <input
                                        name="rg"
                                        value={formData.rg}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Registro Geral"
                                        className="input-field w-full"
                                    />
                                </div>

                                {/* Row 4: Profession */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Profissão</label>
                                    <input
                                        name="profession"
                                        value={formData.profession}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Ex: Designer Gráfico"
                                        className="input-field w-full"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 2. Contato & Social */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-secondary rounded-full"></span>
                                Social & Outros
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">E-mail</label>
                                    <input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Instagram</label>
                                    <input
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="@instagram"
                                        className="input-field w-full"
                                    />
                                </div>

                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 3. Endereço */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                Endereço Completo
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">CEP</label>
                                    <input
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="00000-000"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Endereço</label>
                                    <input
                                        name="street"
                                        value={formData.street}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Rua, Av."
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Número</label>
                                    <input
                                        name="number"
                                        value={formData.number}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="123"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Bairro</label>
                                    <input
                                        name="neighborhood"
                                        value={formData.neighborhood}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Bairro"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Cidade</label>
                                    <input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Cidade"
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Estado</label>
                                    <input
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="UF"
                                        className="input-field w-full"
                                    />
                                </div>

                            </div>
                        </section>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-2xl text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold shadow-lg shadow-[#92FFAD]/20 hover:shadow-[#92FFAD]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin material-icons text-xl">refresh</span>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-xl">check</span>
                                Salvar Cadastro
                            </>
                        )}
                    </button>
                </div>

            </div>

            {/* Helper Styles for this component */}
            <style>{`
        .input-field {
            width: 100%;
            padding: 14px 16px;
            border-radius: 16px;
            background-color: #F9FAFB;
            border: 1px solid #333333;
            color: #111827;
            font-weight: 500;
            outline: none;
            transition: all 0.2s;
        }
        .dark .input-field {
            background-color: #18181b; /* zinc-900 */
            border-color: #27272a;     /* zinc-800 */
            color: #f4f4f5;            /* zinc-100 */
        }
        .input-field:focus {
            border-color: #92FFAD;
            background-color: #FFFFFF;
            box-shadow: 0 0 0 1px #92FFAD;
        }
        .dark .input-field:focus {
            background-color: #09090b; /* zinc-950 */
        }
        .input-field::placeholder {
            color: #9CA3AF;
        }
      `}</style>
        </div>
    );
};

export default NewClientModal;

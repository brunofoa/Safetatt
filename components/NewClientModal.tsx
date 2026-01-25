
import React from 'react';

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Nome</label>
                                    <input type="text" placeholder="Primeiro nome" className="input-field" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Sobrenome</label>
                                    <input type="text" placeholder="Sobrenome completo" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Data de Nascimento</label>
                                    <input type="date" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">CPF</label>
                                    <input type="text" placeholder="000.000.000-00" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">RG / Passaporte</label>
                                    <input type="text" placeholder="Registro Geral" className="input-field" />
                                </div>

                                <div className="col-span-1 md:col-span-3">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Profissão</label>
                                    <input type="text" placeholder="Ex: Designer Gráfico" className="input-field" />
                                </div>

                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 2. Contato & Social */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-secondary rounded-full"></span>
                                Contato & Social
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">E-mail</label>
                                    <input type="email" placeholder="email@exemplo.com" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Telefone</label>
                                    <input type="tel" placeholder="(00) 00000-0000" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Rede Social</label>
                                    <input type="text" placeholder="@instagram" className="input-field" />
                                </div>

                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 3. Endereço */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-purple-400 rounded-full"></span>
                                Endereço Completo
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">CEP</label>
                                    <input type="text" placeholder="00000-000" className="input-field" />
                                </div>

                                <div className="col-span-1 md:col-span-3">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Endereço</label>
                                    <input type="text" placeholder="Rua, Número, Complemento" className="input-field" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Bairro</label>
                                    <input type="text" placeholder="Bairro" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Cidade</label>
                                    <input type="text" placeholder="Cidade" className="input-field" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Estado</label>
                                    <select className="input-field appearance-none">
                                        <option value="">UF</option>
                                        <option value="SP">SP</option>
                                        <option value="RJ">RJ</option>
                                        <option value="MG">MG</option>
                                        {/* Add others as needed */}
                                    </select>
                                </div>

                            </div>
                        </section>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold shadow-lg shadow-[#92FFAD]/20 hover:shadow-[#92FFAD]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                        <span className="material-icons text-xl">check</span>
                        Salvar Cadastro
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
            border: 1px solid #e5e7eb;
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

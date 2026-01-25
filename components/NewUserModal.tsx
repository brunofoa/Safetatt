import React, { useState, useEffect } from 'react';

interface NewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: any) => void;
    initialData?: any;
}

const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [profileType, setProfileType] = useState('tatuador');
    const [userColor, setUserColor] = useState('#92FFAD');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setProfileType(initialData.profileType || 'tatuador');
                setUserColor(initialData.userColor || '#92FFAD');
                setName(initialData.name || '');
                setSurname(initialData.surname || '');
                setEmail(initialData.email || '');
            } else {
                // Reset for new user
                setProfileType('tatuador');
                setUserColor('#92FFAD');
                setName('');
                setSurname('');
                setEmail('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-studio-gray flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">{initialData ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {initialData ? 'Atualize as informações do usuário' : 'Adicione um novo membro à equipe'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Photo & Color */}
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden relative group cursor-pointer bg-gray-100 dark:bg-slate-700">
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                                    <span className="material-icons text-white opacity-0 group-hover:opacity-100 text-3xl">camera_alt</span>
                                </div>
                                <img src={initialData?.avatar || "https://i.pravatar.cc/150?img=12"} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Foto de Perfil</span>
                        </div>

                        <div className="flex-1 w-full space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">Cor de Identificação</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="color"
                                        value={userColor}
                                        onChange={(e) => setUserColor(e.target.value)}
                                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-transparent"
                                    />
                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg">{userColor}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Usada para identificar agendamentos na agenda.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">Perfil de Acesso</label>
                                <div className="relative">
                                    <select
                                        value={profileType}
                                        onChange={(e) => setProfileType(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="master">Master (Administrador)</option>
                                        <option value="tatuador">Tatuador</option>
                                        <option value="piercer">Piercer</option>
                                        <option value="recepcionista">Recepcionista</option>
                                    </select>
                                    <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-studio-gray/50" />

                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">Nome</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="text"
                                placeholder="Ex: João"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">Sobrenome</label>
                            <input
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="text"
                                placeholder="Ex: Silva"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">CPF</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" placeholder="000.000.000-00" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">Telefone</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" placeholder="(00) 00000-0000" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">E-mail</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="email"
                                placeholder="email@exemplo.com"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-studio-gray bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={() => onSave({ profileType, userColor, name, surname, email })}
                        className="px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-icons text-lg">check</span>
                        SALVAR USUÁRIO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewUserModal;

import React, { useState } from 'react';
import { teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentStudio } = useAuth();

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');
    const [role, setRole] = useState('tatuador');
    const [color, setColor] = useState('#92FFAD');

    // Avatar State
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `invites/${Date.now()}_${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Error uploading avatar:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error in avatar upload:', error);
            return null;
        }
    };

    const handleInvite = async () => {
        if (!firstName || !lastName || !email) {
            alert('Por favor, preencha Nome, Sobrenome e E-mail.');
            return;
        }

        if (!currentStudio?.id) {
            console.warn('No Studio ID in context');
        }

        const studioId = currentStudio?.id || 'rtsdtoszxrilfuwgdbnq';
        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        setIsLoading(true);
        try {
            let avatarUrl = undefined;
            if (avatarFile) {
                const url = await uploadAvatar(avatarFile);
                if (url) avatarUrl = url;
            }

            const res = await teamService.inviteMember({
                email,
                role,
                studioId,
                fullName,
                cpf,
                phone,
                color,
                avatarUrl
            });

            if (res.success) {
                alert(res.message);
                onSuccess();
                onClose();
                // Reset form
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhone('');
                setCpf('');
                setColor('#92FFAD');
                setRole('tatuador');
                setAvatarFile(null);
                setAvatarPreview(null);
            } else {
                alert('Erro: ' + res.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao convidar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-8 py-6 border-b border-studio-gray flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Convidar Novo Membro</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Preencha os dados do profissional.
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
                <div className="p-8 space-y-6">

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center">
                        <label className="relative cursor-pointer group">
                            <div className={`w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden hover:border-primary transition-colors ${!avatarPreview && firstName ? 'bg-[#333333] text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : firstName ? (
                                    <span className="text-4xl font-bold uppercase">{firstName.charAt(0)}</span>
                                ) : (
                                    <span className="material-icons text-4xl text-gray-300 dark:text-zinc-600 group-hover:text-primary transition-colors">add_a_photo</span>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            <span className="text-xs text-gray-400 font-bold mt-2 block text-center group-hover:text-primary">Adicionar Foto</span>
                        </label>
                    </div>

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block">Nome *</label>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="text"
                                placeholder="João"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block">Sobrenome *</label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="text"
                                placeholder="Silva"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-2 block">E-mail *</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                            type="email"
                            placeholder="joao@estudio.com"
                        />
                    </div>

                    {/* Phone & CPF Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block">Telefone/WhatsApp</label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="tel"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block">CPF</label>
                            <input
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                                type="text"
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>

                    {/* Role & Color Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block">Função</label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-studio-gray bg-transparent dark:text-white focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="master">Master</option>
                                    <option value="tatuador">Tatuador</option>
                                    <option value="piercer">Piercer</option>
                                    <option value="recepcionista">Recepcionista</option>
                                </select>
                                <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block">Cor de Exibição</label>
                            <div className="h-[50px] flex items-center">
                                <div className="flex items-center gap-3 w-full bg-gray-50 dark:bg-zinc-800 rounded-xl px-2 border border-studio-gray h-[48px]">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent"
                                        title="Escolher cor"
                                    />
                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">{color}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <span className="font-bold text-blue-600 dark:text-blue-400">Nota:</span> O usuário será adicionado à equipe imediatamente. O convite por e-mail permitirá que ele defina sua senha de acesso.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-studio-gray bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-4 sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleInvite}
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="material-icons animate-spin">sync</span>
                        ) : (
                            <span className="material-icons text-lg">person_add</span>
                        )}
                        {isLoading ? 'SALVANDO...' : 'Cadastrar Equipe'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteUserModal;

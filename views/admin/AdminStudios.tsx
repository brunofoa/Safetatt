
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { teamService } from '../../services/teamService';
import NewStudioForm from './NewStudioForm';

interface AdminStudiosProps {
    onNewStudio?: () => void;
}

const AdminStudios: React.FC<AdminStudiosProps> = ({ onNewStudio }) => {
    const [studios, setStudios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudio, setEditingStudio] = useState<any>(null); // Studio being edited
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; studioId: string | null; action: 'activate' | 'deactivate' | null; studioName: string }>({ isOpen: false, studioId: null, action: null, studioName: '' });

    // New Studio Form
    const [newStudioName, setNewStudioName] = useState('');
    const [newStudioSlug, setNewStudioSlug] = useState('');
    const [masterEmail, setMasterEmail] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchStudios();
    }, []);

    const fetchStudios = async () => {
        setLoading(true);

        const { data: studiosData, error: studiosError } = await supabase
            .from('studios')
            .select('*')
            .order('created_at', { ascending: false });

        if (studiosError) {
            console.error(studiosError);
            setLoading(false);
            return;
        }

        const studioIds = (studiosData || []).map(s => s.id);

        if (studioIds.length === 0) {
            setStudios([]);
            setLoading(false);
            return;
        }

        // Fetch masters for these studios
        const { data: membersData } = await supabase
            .from('studio_members')
            .select('studio_id, profiles(full_name)')
            .eq('role', 'MASTER')
            .in('studio_id', studioIds);

        const studiosWithMaster = (studiosData || []).map(studio => {
            const masterMember = membersData?.find(m => m.studio_id === studio.id);
            // Supabase returns joined tables as arrays or objects depending on relationship.
            // Safely accessing profile data.
            const profile: any = masterMember?.profiles;
            const masterName = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name;

            return {
                ...studio,
                master_name: masterName || 'Convite Pendente'
            };
        });

        setStudios(studiosWithMaster);
        setLoading(false);
    };

    const handleToggleClick = (studio: any) => {
        const newAction = studio.status === 'active' ? 'deactivate' : 'activate';
        setConfirmModal({
            isOpen: true,
            studioId: studio.id,
            studioName: studio.name,
            action: newAction
        });
    };

    const confirmToggleStatus = async () => {
        if (!confirmModal.studioId || !confirmModal.action) return;

        const newStatus = confirmModal.action === 'activate' ? 'active' : 'inactive';

        try {
            const { error } = await supabase
                .from('studios')
                .update({ status: newStatus })
                .eq('id', confirmModal.studioId);

            if (error) throw error;

            fetchStudios();
        } catch (err) {
            alert('Erro ao atualizar status');
        } finally {
            setConfirmModal({ isOpen: false, studioId: null, action: null, studioName: '' });
        }
    };

    const handleCreateStudio = async () => {
        if (!newStudioName || !newStudioSlug || !masterEmail) return;
        setCreating(true);

        try {
            // 1. Create Studio
            const { data: studio, error: studioError } = await supabase
                .from('studios')
                .insert({
                    name: newStudioName,
                    slug: newStudioSlug,
                    status: 'active'
                })
                .select()
                .single();

            if (studioError) throw studioError;

            // 2. Invite Master
            const inviteRes = await teamService.inviteMember({
                email: masterEmail,
                role: 'MASTER',
                studioId: studio.id,
                fullName: 'Master TBD', // Invite flow asks for name later usually, or we can ask in form
            });

            if (!inviteRes.success) {
                alert('Estúdio criado, mas erro ao enviar convite: ' + inviteRes.error);
            } else {
                alert('Estúdio criado e convite enviado!');
                setIsModalOpen(false);
                setNewStudioName('');
                setNewStudioSlug('');
                setMasterEmail('');
                fetchStudios();
            }

        } catch (error: any) {
            console.error(error);
            alert('Erro ao criar estúdio: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Gestão de Estúdios</h1>
                <button
                    onClick={() => {
                        setEditingStudio(null);
                        setIsModalOpen(true);
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] hover:opacity-90 text-black font-bold py-2 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#92FFAD]/20"
                >
                    <span className="material-icons">add</span>
                    Novo Estúdio
                </button>
            </div>

            {/* ViewSwitcher removed for simplicity unless user is using it. Assuming I am replacing the table view or keeping it. */}

            {/* If we are editing, show the Form. If viewing list, show list. 
                 But original code had a Modal for "Novo Estúdio" (custom inline). 
                 Wait, the original code had `isModalOpen` which showed a CUSTOM FORM inline in `AdminStudios.tsx`.
                 User asked me to use `NewStudioForm` in previous steps? 
                 Ah, `NewStudioForm.tsx` is located at `views/admin/NewStudioForm.tsx`.
                 But `AdminStudios.tsx` (File read in step 273) HAS AN INLINE MODAL at the bottom!
                 Lines 201-255 are a manual "Novo Estúdio" modal inside `AdminStudios`.
                 It does NOT use `NewStudioForm` component yet.
                 
                 The user *previously* asked to fix `NewStudioForm`. 
                 I should probably REPLACE the inline modal with `NewStudioForm` component since I just refactored it.
                 Or I am supposed to fix the inline one?
                 The user prompt "na pagina admin, para adicionar estudio e master...".
                 And I edited `NewStudioForm.tsx` in previous turns.
                 So `AdminStudios` SHOULD indeed use `NewStudioForm`.
                 
                 I will replace the inline modal with `NewStudioForm`.
                 State `isListing` vs `isFormOpen`.
              */}

            {
                isModalOpen ? (
                    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-800">
                            <NewStudioForm
                                initialData={editingStudio}
                                onCancel={() => {
                                    setIsModalOpen(false);
                                    setEditingStudio(null);
                                }}
                                onSuccess={() => {
                                    setIsModalOpen(false);
                                    setEditingStudio(null);
                                    fetchStudios();
                                    alert(editingStudio ? 'Estúdio atualizado!' : 'Estúdio criado!');
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Estúdio</th>
                                    <th className="px-6 py-4">CNPJ</th>
                                    <th className="px-6 py-4">Responsável (Master)</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {loading && (
                                    <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Carregando...</td></tr>
                                )}
                                {!loading && studios.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Nenhum estúdio encontrado.</td></tr>
                                )}
                                {studios.map(studio => (
                                    <tr key={studio.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{studio.name}</div>
                                            <div className="text-xs text-zinc-500">/{studio.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-sm">{studio.cnpj || '-'}</td>
                                        <td className="px-6 py-4 text-zinc-300 text-sm flex items-center gap-2">
                                            <span className="material-icons text-zinc-600 text-sm">person</span>
                                            {studio.master_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${studio.status === 'active'
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {studio.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleClick(studio)}
                                                className={`transition-colors p-2 ${studio.status === 'active' ? 'text-green-500 hover:text-green-400' : 'text-zinc-500 hover:text-white'}`}
                                                title={studio.status === 'active' ? 'Desativar' : 'Ativar'}
                                            >
                                                <span className="material-icons">{studio.status === 'active' ? 'toggle_on' : 'toggle_off'}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingStudio(studio);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-zinc-500 hover:text-white transition-colors p-2"
                                            >
                                                <span className="material-icons">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Confirmation Modal */}
            {
                confirmModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 space-y-6 animate-fade-in shadow-2xl">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.action === 'deactivate' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                    <span className="material-icons text-3xl">
                                        {confirmModal.action === 'deactivate' ? 'warning' : 'check_circle'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {confirmModal.action === 'deactivate' ? 'Desativar Estúdio?' : 'Ativar Estúdio?'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        Você está prestes a {confirmModal.action === 'deactivate' ? 'desativar' : 'ativar'} o estúdio <span className="text-white font-bold">{confirmModal.studioName}</span>.
                                        {confirmModal.action === 'deactivate' && ' O acesso será bloqueado imediatamente.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal({ isOpen: false, studioId: null, action: null, studioName: '' })}
                                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmToggleStatus}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-colors text-black ${confirmModal.action === 'deactivate' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* New/Edit Modal Wrapper */}
            {
                isModalOpen && (
                    // Since AdminStudios.tsx is usually a list, and NewStudioForm is a full page or large component, 
                    // we will render it fullscreen
                    <div className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto">
                        <NewStudioForm
                            onCancel={() => {
                                setIsModalOpen(false);
                                setEditingStudio(null);
                            }}
                            onSuccess={() => {
                                setIsModalOpen(false);
                                setEditingStudio(null);
                                fetchStudios();
                            }}
                            initialData={editingStudio}
                        />
                    </div>
                )
            }
        </div >
    );
};

export default AdminStudios;

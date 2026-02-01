
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { teamService } from '../../services/teamService';

interface AdminStudiosProps {
    onNewStudio?: () => void;
}

const AdminStudios: React.FC<AdminStudiosProps> = ({ onNewStudio }) => {
    const [studios, setStudios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleToggleStatus = async (studioId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        if (!confirm(`Deseja alterar o status para ${newStatus}?`)) return;

        const { error } = await supabase
            .from('studios')
            .update({ status: newStatus })
            .eq('id', studioId);

        if (error) {
            alert('Erro ao atualizar status');
        } else {
            fetchStudios();
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
                    onClick={onNewStudio}
                    className="w-full md:w-auto bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] hover:opacity-90 text-black font-bold py-2 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#92FFAD]/20"
                >
                    <span className="material-icons">add</span>
                    Novo Estúdio
                </button>
            </div>

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
                                        onClick={() => handleToggleStatus(studio.id, studio.status || 'active')}
                                        className="text-zinc-500 hover:text-white transition-colors p-2"
                                        title={studio.status === 'active' ? 'Desativar' : 'Ativar'}
                                    >
                                        <span className="material-icons">{studio.status === 'active' ? 'toggle_on' : 'toggle_off'}</span>
                                    </button>
                                    <button className="text-zinc-500 hover:text-white transition-colors p-2">
                                        <span className="material-icons">edit</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Novo Estúdio */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-6">
                        <h2 className="text-xl font-bold text-white">Novo Estúdio</h2>

                        <div>
                            <label className="text-xs font-bold text-zinc-400 mb-2 block">Nome do Estúdio</label>
                            <input
                                value={newStudioName}
                                onChange={e => setNewStudioName(e.target.value)}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Ex: Studio Art"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-400 mb-2 block">Slug (URL)</label>
                            <input
                                value={newStudioSlug}
                                onChange={e => setNewStudioSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="ex: studio-art"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-400 mb-2 block">E-mail do Master</label>
                            <input
                                value={masterEmail}
                                onChange={e => setMasterEmail(e.target.value)}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="admin@studio.com"
                                type="email"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={creating}
                                className="px-4 py-2 text-zinc-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateStudio}
                                disabled={creating}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl disabled:opacity-50"
                            >
                                {creating ? 'Criando...' : 'Criar Estúdio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudios;

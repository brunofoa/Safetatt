import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, PaperPlaneRight, User, Users, Image, MagicWand, CalendarBlank, Funnel, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
import { marketingService } from '../services/marketingService';
import { useAuth } from '../contexts/AuthContext';

interface MarketingCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialAudience?: string; // Pre-filled from dashboard card
    initialTemplate?: string; // Pre-filled template ID/Type
}

// --- MOCK DATA ---
const MOCK_CLIENTS_FULL = [
    { id: '1', name: 'Alana Bastos', phone: '(11) 99999-1111', lastVisit: '2023-10-15', artist: 'Marcus Thorne', gender: 'Feminino', birthMonth: 1 },
    { id: '2', name: 'Bruno Foa', phone: '(11) 98888-2222', lastVisit: '2023-11-20', artist: 'Elena Vanc', gender: 'Masculino', birthMonth: 5 },
    { id: '3', name: 'Carla Dias', phone: '(11) 97777-3333', lastVisit: '2023-08-05', artist: 'Roberto Lima', gender: 'Feminino', birthMonth: 5 },
    { id: '4', name: 'Daniel Rocha', phone: '(11) 96666-4444', lastVisit: '2024-01-10', artist: 'Marcus Thorne', gender: 'Masculino', birthMonth: 2 },
    { id: '5', name: 'Elena Vanc', phone: '(11) 95555-5555', lastVisit: '2023-12-01', artist: 'Roberto Lima', gender: 'Feminino', birthMonth: 1 },
    { id: '6', name: 'Fernando Silva', phone: '(11) 94444-6666', lastVisit: '2023-09-12', artist: 'Marcus Thorne', gender: 'Masculino', birthMonth: 5 },
    { id: '7', name: 'Gabriela Souza', phone: '(11) 93333-7777', lastVisit: '2023-07-20', artist: 'Elena Vanc', gender: 'Feminino', birthMonth: 8 },
    { id: '8', name: 'Hugo Santos', phone: '(11) 92222-8888', lastVisit: '2023-06-15', artist: 'Roberto Lima', gender: 'Masculino', birthMonth: 5 },
    { id: '9', name: 'Igor Oliveira', phone: '(11) 91111-9999', lastVisit: '2023-05-30', artist: 'Marcus Thorne', gender: 'Masculino', birthMonth: 12 },
    { id: '10', name: 'Julia Lima', phone: '(11) 90000-0000', lastVisit: '2023-04-10', artist: 'Elena Vanc', gender: 'Feminino', birthMonth: 5 },
];

const MarketingCampaignModal: React.FC<MarketingCampaignModalProps> = ({ isOpen, onClose, initialAudience, initialTemplate }) => {
    const [step, setStep] = useState(1);
    const [campaignName, setCampaignName] = useState('');
    const [audience, setAudience] = useState('all');
    const [messageContent, setMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    // Filter States
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1, // 1-12
        gender: '',
        artist: '',
        searchText: '',
    });

    // Selection State
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCampaignName(`Campanha ${new Date().toLocaleDateString()}`);
            setAudience(initialAudience || 'all');

            // Set template based on initialTemplate
            if (initialTemplate === 'birthday') {
                setMessageContent("Olá {nome}! 🎉 Feliz aniversário! O SafeTatt tem um presente especial para você: 20% OFF na sua próxima tattoo. Agende agora: {link_agendamento}");
                // Default filter to current month for birthday
                setFilters(prev => ({ ...prev, month: new Date().getMonth() + 1 }));
            } else if (initialTemplate === 'winback') {
                setMessageContent("Oi {nome}, faz tempo que não te vemos! Que tal riscar algo novo? Estamos com novidades no estúdio. Responda essa msg para saber mais!");
            } else if (initialTemplate === 'return') {
                setMessageContent("Olá {nome}, tudo bem? Notei que temos uma sessão para finalizar seu projeto. Vamos agendar? Acesse: {link_agendamento}");
            } else {
                setMessageContent("");
            }
            // Reset media
            setMediaFile(null);
            setMediaPreview(null);
            setFilters({ month: new Date().getMonth() + 1, gender: '', artist: '', searchText: '' });
            setSelectedClientIds([]);
        }
    }, [isOpen, initialAudience, initialTemplate]);

    // Media cleanup
    useEffect(() => {
        return () => {
            if (mediaPreview) URL.revokeObjectURL(mediaPreview);
        };
    }, [mediaPreview]);

    // --- FILTER LOGIC ---
    const filteredClients = useMemo(() => {
        return MOCK_CLIENTS_FULL.filter(client => {
            // 1. Audience Type Filter
            if (audience === 'birthday') {
                if (client.birthMonth !== filters.month) return false;
            }
            if (audience === 'winback') {
                // Mock logic: assume anyone visited > 3 months ago is winback
                // For demo, let's just show everyone unless filtered by other things, 
                // typically you'd compare client.lastVisit
            }

            // 2. Explicit Filters
            if (filters.gender && client.gender !== filters.gender) return false;
            if (filters.artist && client.artist !== filters.artist) return false;
            if (filters.searchText) {
                const search = filters.searchText.toLowerCase();
                if (!client.name.toLowerCase().includes(search) && !client.phone.includes(search)) return false;
            }

            return true;
        });
    }, [audience, filters]);

    // Auto-select filtered clients when list changes (Optional, or manual only. Let's do manual only but default select all on load? No, manual is safer.)
    // Let's default select ALL when the audience changes or modal opens, logic below:
    useEffect(() => {
        if (isOpen && step === 1) {
            const ids = filteredClients.map(c => c.id);
            setSelectedClientIds(ids);
        }
    }, [isOpen, step, audience, filters.month]); // Re-select when core audience params change


    const toggleClient = (id: string) => {
        setSelectedClientIds(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const allIds = filteredClients.map(c => c.id);
        if (selectedClientIds.length === allIds.length) {
            setSelectedClientIds([]);
        } else {
            setSelectedClientIds(allIds);
        }
    };

    if (!isOpen) return null;

    const { currentStudio } = useAuth(); // Import useAuth at top level if not already

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleFinish = async () => {
        if (!currentStudio?.id) {
            alert('Erro: Estúdio não identificado.');
            return;
        }

        setIsSending(true);
        try {
            await marketingService.createCampaign({
                studio_id: currentStudio.id,
                name: campaignName,
                type: (initialTemplate as any) || 'custom',
                status: 'sent',
                audience_count: selectedClientIds.length,
                channel: 'whatsapp'
            });

            // Small delay for UI feedback
            setTimeout(() => {
                setIsSending(false);
                onClose();
                alert(`Campanha enviada com sucesso para ${selectedClientIds.length} clientes!`);
            }, 500);
        } catch (error) {
            console.error(error);
            alert('Erro ao criar campanha.');
            setIsSending(false);
        }
    };

    const insertVariable = (variable: string) => {
        setMessageContent(prev => prev + variable);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-white dark:bg-[#121212] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#333333]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212]">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            Nova Campanha
                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold">
                                Passo {step} de 3
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {step === 1 && 'Configuração e Público'}
                            {step === 2 && 'Conteúdo da Mensagem'}
                            {step === 3 && 'Revisão e Disparo'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-slate-400 hover:text-red-500">
                        <X size={24} weight="bold" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 dark:bg-[#0A0A0A]">

                    {/* STEP 1: CONFIGURATION */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome da Campanha</label>
                                    <input
                                        type="text"
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#333333] bg-white dark:bg-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="Ex: Promoção de Verão"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Público Alvo</label>
                                    <select
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#333333] bg-white dark:bg-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                                    >
                                        <option value="all">Todos os Clientes</option>
                                        <option value="birthday">Aniversariantes</option>
                                        <option value="winback">Reconquista (Inativos)</option>
                                        <option value="return">Retorno de Sessão</option>
                                    </select>
                                </div>
                            </div>

                            {/* DYNAMIC FILTERS */}
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Funnel size={18} className="text-primary" weight="fill" />
                                    <p className="text-sm font-bold text-gray-700 dark:text-white">Filtros Avançados</p>
                                </div>
                                <div className="flex flex-wrap gap-4">

                                    {/* Month Selector (Birthday only) */}
                                    {audience === 'birthday' && (
                                        <div className="flex-1 min-w-[150px]">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Mês</label>
                                            <select
                                                value={filters.month}
                                                onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] dark:text-gray-200 text-sm focus:border-primary outline-none"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* General Filters (Winback/All/Return) */}
                                    {audience !== 'birthday' && (
                                        <>
                                            <div className="flex-1 min-w-[150px]">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Gênero</label>
                                                <select
                                                    value={filters.gender}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] dark:text-gray-200 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">Todos</option>
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Feminino">Feminino</option>
                                                    <option value="Outro">Outro</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 min-w-[150px]">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Profissional</label>
                                                <select
                                                    value={filters.artist}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, artist: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] dark:text-gray-200 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">Todos</option>
                                                    <option value="Marcus Thorne">Marcus Thorne</option>
                                                    <option value="Elena Vanc">Elena Vanc</option>
                                                    <option value="Roberto Lima">Roberto Lima</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* Search */}
                                    <div className="flex-[2] min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Buscar Cliente</label>
                                        <div className="relative">
                                            <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Nome ou Celular..."
                                                value={filters.searchText}
                                                onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] dark:text-gray-200 text-sm focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CLIENT LIST TABLE */}
                            <div className="rounded-2xl border border-[#333333] overflow-hidden bg-white dark:bg-[#1A1A1A]">
                                <div className="p-3 bg-gray-50 dark:bg-white/5 border-b border-[#333333] flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedClientIds.length === filteredClients.length && filteredClients.length > 0}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-transparent"
                                        />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {selectedClientIds.length} selecionados
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">Total filtrado: {filteredClients.length}</span>
                                </div>

                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 dark:bg-[#121212] sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 w-10"></th>
                                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Celular</th>
                                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Última Visita</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            {filteredClients.map(client => (
                                                <tr
                                                    key={client.id}
                                                    className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${selectedClientIds.includes(client.id) ? 'bg-primary/5' : ''}`}
                                                    onClick={() => toggleClient(client.id)}
                                                >
                                                    <td className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedClientIds.includes(client.id)}
                                                            readOnly
                                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-transparent pointer-events-none"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-sm font-medium text-gray-900 dark:text-gray-200">{client.name}</td>
                                                    <td className="p-3 text-sm text-gray-500">{client.phone}</td>
                                                    <td className="p-3 text-sm text-gray-500">{new Date(client.lastVisit).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {filteredClients.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                                                        Nenhum cliente encontrado com os filtros atuais.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-white/5 border-t border-[#333333] text-center">
                                    <p className="text-xs text-primary font-bold">
                                        Selecionados para envio: {selectedClientIds.length} clientes
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONTENT */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mensagem</label>
                                    <div className="flex gap-2 flex-wrap justify-end">
                                        <button onClick={() => insertVariable('{nome}')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-white/10 rounded hover:bg-gray-300 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300">+ Nome</button>
                                        <button onClick={() => insertVariable('{nome_estudio}')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-white/10 rounded hover:bg-gray-300 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300">+ Nome Estúdio</button>
                                        <button onClick={() => insertVariable('{link_agendamento}')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-white/10 rounded hover:bg-gray-300 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300">+ Link Agendamento</button>
                                    </div>
                                </div>
                                <textarea
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    className="w-full h-48 px-4 py-3 rounded-xl border border-[#333333] bg-white dark:bg-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                    placeholder="Digite sua mensagem aqui..."
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-slate-400">Dica: Use variáveis para personalizar.</p>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="media-upload"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <label
                                            htmlFor="media-upload"
                                            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light transition-colors cursor-pointer"
                                        >
                                            <Image size={18} weight="bold" />
                                            {mediaFile ? 'Trocar Mídia' : 'Anexar Mídia'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments Preview */}
                            {mediaPreview && (
                                <div className="relative w-full h-40 bg-gray-100 dark:bg-black/40 rounded-xl overflow-hidden border border-[#333333] flex items-center justify-center">
                                    <button
                                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors z-10"
                                    >
                                        <X size={16} />
                                    </button>
                                    {mediaFile?.type.startsWith('video') ? (
                                        <video src={mediaPreview} controls className="h-full max-w-full" />
                                    ) : (
                                        <img src={mediaPreview} alt="Preview" className="h-full object-contain" />
                                    )}
                                </div>
                            )}

                            {/* Preview (Mock) */}
                            <div className="p-4 bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#333333] opacity-80">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Pré-visualização (Exemplo)</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                    {messageContent
                                        .replace('{nome}', 'Bruno')
                                        .replace('{nome_estudio}', 'SafeTatt Studio')
                                        .replace('{link_agendamento}', 'safetatt.com/agendar/123')
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SUMMARY */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#333333] text-center">
                                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <PaperPlaneRight size={32} weight="fill" />
                                </div>
                                <h3 className="text-xl font-bold dark:text-white mb-2">Tudo pronto para enviar!</h3>
                                <p className="text-gray-500 mb-6">Sua campanha <span className="text-primary font-bold">"{campaignName}"</span> está configurada.</p>

                                <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto mb-4">
                                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Destinatários</p>
                                        <p className="font-medium dark:text-white truncate">
                                            {
                                                audience === 'all' ? 'Todos os Clientes' :
                                                    audience === 'birthday' ? 'Aniversariantes' :
                                                        audience === 'winback' ? 'Inativos (+90 dias)' :
                                                            'Sessões em Aberto'
                                            }
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Estimativa</p>
                                        <p className="font-medium dark:text-white">{selectedClientIds.length} Pessoas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] flex justify-between items-center z-10">
                    <button
                        onClick={step === 1 ? onClose : handleBack}
                        disabled={isSending}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        {step === 1 ? 'Cancelar' : 'Voltar'}
                    </button>

                    <button
                        onClick={step === 3 ? handleFinish : handleNext}
                        disabled={isSending || (step === 1 && selectedClientIds.length === 0)}
                        className={`btn-gradient text-black font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSending ? (
                            <>Disparando...</>
                        ) : step === 3 ? (
                            <>Disparar Agora <PaperPlaneRight size={18} weight="bold" /></>
                        ) : (
                            <>Próximo Passo <span className="material-icons text-sm">arrow_forward</span></>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MarketingCampaignModal;

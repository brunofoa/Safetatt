import React, { useState, useEffect } from 'react';
import { Gift, ClockCounterClockwise, Needle, Sparkle, PaperPlaneRight } from '@phosphor-icons/react';
import MarketingCampaignModal from '../components/MarketingCampaignModal';
import { marketingService, Campaign } from '../services/marketingService';
import { useAuth } from '../contexts/AuthContext';

const Marketing: React.FC = () => {
    const { currentStudio } = useAuth();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
    const [selectedAudience, setSelectedAudience] = useState<string | undefined>(undefined);

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [metrics, setMetrics] = useState({ birthdayCount: 0, winbackCount: 0, returnCount: 0 });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentStudio?.id) return;
        setLoading(true);
        const [campaignsData, metricsData] = await Promise.all([
            marketingService.getCampaigns(currentStudio.id),
            marketingService.getDashboardMetrics(currentStudio.id)
        ]);
        setCampaigns(campaignsData || []);
        setMetrics(metricsData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentStudio]);

    const handleOpenWizard = (template?: string, audience?: string) => {
        setSelectedTemplate(template);
        setSelectedAudience(audience);
        setIsWizardOpen(true);
    };

    const handleCloseWizard = () => {
        setIsWizardOpen(false);
        setSelectedTemplate(undefined);
        setSelectedAudience(undefined);
        loadData(); // Refresh list after closing wizard (assuming creation happened)
    };

    const cardStyle = "p-6 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden";
    const iconContainerStyle = "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300";

    return (
        <div className="px-6 max-w-7xl mx-auto min-h-screen pb-20">
            {/* SVG Gradient Definition */}
            <svg width="0" height="0" className="absolute" aria-hidden="true">
                <defs>
                    <linearGradient id="marketing-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop stopColor="#92FFAD" offset="0%" />
                        <stop stopColor="#5CDFF0" offset="100%" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Modal */}
            <MarketingCampaignModal
                isOpen={isWizardOpen}
                onClose={handleCloseWizard}
                initialAudience={selectedAudience}
                initialTemplate={selectedTemplate}
            />

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50 mb-2">Marketing & Automação</h1>
                <p className="text-gray-500 dark:text-zinc-400 font-medium">Crie campanhas inteligentes para engajar seus clientes</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="mb-8">
                <h2 className="text-xl font-bold dark:text-zinc-50 mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    Oportunidades de Hoje
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1 - Birthdays */}
                    <div className={cardStyle} onClick={() => handleOpenWizard('birthday', 'birthday')}>
                        <div className={`${iconContainerStyle} bg-gray-50 dark:bg-zinc-800`}>
                            <Gift size={32} weight="duotone" color="#333333" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-2">Aniversariantes</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{metrics.birthdayCount} Aniversariantes hoje</p>
                        <p className="text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black transition-all flex items-center gap-2 hover:scale-105 w-fit shadow-sm">
                            Enviar Parabéns <span className="material-icons text-[14px] text-black">arrow_forward</span>
                        </p>
                    </div>

                    {/* Card 2 - Win-back */}
                    <div className={cardStyle} onClick={() => handleOpenWizard('winback', 'winback')}>
                        <div className={`${iconContainerStyle} bg-gray-50 dark:bg-zinc-800`}>
                            <ClockCounterClockwise size={32} weight="duotone" color="#333333" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-2">Reconquista</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{metrics.winbackCount} clientes inativos (+90 dias)</p>
                        <p className="text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black transition-all flex items-center gap-2 hover:scale-105 w-fit shadow-sm">
                            Recuperar Clientes <span className="material-icons text-[14px] text-black">arrow_forward</span>
                        </p>
                    </div>

                    {/* Card 3 - Session Return */}
                    <div className={cardStyle} onClick={() => handleOpenWizard('return', 'return')}>
                        <div className={`${iconContainerStyle} bg-gray-50 dark:bg-zinc-800`}>
                            <Needle size={32} weight="duotone" color="#333333" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-2">Retorno</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{metrics.returnCount} Clientes com sessões em aberto</p>
                        <p className="text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black transition-all flex items-center gap-2 hover:scale-105 w-fit shadow-sm">
                            Agendar Término <span className="material-icons text-[14px] text-black">arrow_forward</span>
                        </p>
                    </div>

                    {/* Card 4 - Custom */}
                    <div className={`${cardStyle} border-dashed border-2`} onClick={() => handleOpenWizard('custom', 'all')}>
                        <div className={`${iconContainerStyle} bg-gray-50 dark:bg-zinc-800`}>
                            <Sparkle size={32} weight="duotone" color="#333333" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-2">Campanha Livre</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Criar novidade ou promoção do zero</p>
                        <p className="text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black transition-all flex items-center gap-2 hover:scale-105 w-fit shadow-sm">
                            Começar do Zero <span className="material-icons text-[14px] text-black">add</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Campaign History */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Histórico de Campanhas</h2>
                    {campaigns.length > 0 && (
                        <button className="text-sm text-primary font-bold hover:underline">Ver Todos</button>
                    )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-[#333333] dark:border-zinc-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Carregando histórico...</div>
                    ) : campaigns.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <PaperPlaneRight size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-1">Nenhuma campanha enviada</h3>
                            <p className="text-gray-500 mb-4">Suas campanhas aparecerão aqui.</p>
                            <button
                                onClick={() => handleOpenWizard('custom', 'all')}
                                className="px-6 py-2 rounded-xl border border-primary text-primary font-bold hover:bg-primary hover:text-black transition-colors"
                            >
                                Criar Primeira Campanha
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                                <tr>
                                    <th className="p-4 pl-6 text-xs font-bold text-gray-500 uppercase">Campanha</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Público</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Enviado em</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {campaigns.map((camp) => (
                                    <tr key={camp.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <p className="font-bold dark:text-zinc-50">{camp.name}</p>
                                            <p className="text-xs text-gray-500 uppercase">{camp.type}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-sm text-gray-400">people</span>
                                                <span className="font-medium dark:text-zinc-300">{camp.audience_count} pessoas</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-zinc-400">
                                            {camp.created_at ? new Date(camp.created_at).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${camp.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                camp.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-zinc-300'
                                                }`}>
                                                {camp.status === 'sent' ? 'Enviado' : camp.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Marketing;

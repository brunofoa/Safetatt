import React, { useState, useEffect } from 'react';
import { Coins, Wallet, Clock, Funnel, MagnifyingGlass, Plus, Minus, X } from '@phosphor-icons/react';
import { loyaltyService } from '../services/loyaltyService';
import { useAuth } from '../contexts/AuthContext';

interface LoyaltyProps {
    onViewClientProfile?: (clientId: string) => void;
}

const Loyalty: React.FC<LoyaltyProps> = ({ onViewClientProfile }) => {
    const { session, currentStudio } = useAuth();
    const [metrics, setMetrics] = useState({ totalLiability: 0, redeemedMonth: 0, expiringSoon: 750.00 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, balance, expiring, vip
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedClientForAdjust, setSelectedClientForAdjust] = useState<any>(null);
    const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Real Client Data
    const [clients, setClients] = useState<any[]>([]);

    const handleOpenAdjust = (client: any) => {
        setSelectedClientForAdjust(client);
        setAdjustAmount('');
        setAdjustReason('');
        setIsAdjustModalOpen(true);
    };

    const confirmAdjustment = async () => {
        if (!selectedClientForAdjust || !adjustAmount) return;

        try {
            if (!currentStudio?.id) {
                alert('Erro: Estúdio não identificado.');
                return;
            }

            await loyaltyService.createTransaction({
                studio_id: currentStudio.id,
                client_id: selectedClientForAdjust.id,
                amount: Number(adjustAmount),
                type: adjustType,
                description: adjustReason || 'Ajuste Manual',
                expires_at: adjustType === 'CREDIT' ? new Date(new Date().setDate(new Date().getDate() + 90)).toISOString() : undefined // Default 90 days for manual credits
            });

            alert(`Ajuste de ${adjustType === 'CREDIT' ? 'Crédito' : 'Débito'} de R$ ${adjustAmount} realizado para ${selectedClientForAdjust.name}.`);

            // Reload Data
            if (currentStudio?.id) {
                const updatedClients = await loyaltyService.getClientsWithLoyalty(currentStudio.id);
                setClients(updatedClients);
                const updatedMetrics = await loyaltyService.getDashboardMetrics(currentStudio.id);
                setMetrics(updatedMetrics);
            }

            setIsAdjustModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Erro ao realizar ajuste.');
        }
    };

    useEffect(() => {
        async function loadData() {
            if (!session?.user || !currentStudio?.id) return;

            try {
                // Load Metrics
                const metricsData = await loyaltyService.getDashboardMetrics(currentStudio.id);
                setMetrics(metricsData);

                // Load Clients
                const clientsData = await loyaltyService.getClientsWithLoyalty(currentStudio.id);
                setClients(clientsData);

            } catch (error) {
                console.error("Failed to load loyalty data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [session, currentStudio]);

    // Filtering Logic
    const filteredClients = clients.filter(client => {
        // Search Filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesName = client.name.toLowerCase().includes(searchLower);
            const matchesCpf = client.cpf ? client.cpf.includes(searchTerm) : false; // Check CPF if exists
            const matchesPhone = client.phone.includes(searchTerm);

            if (!matchesName && !matchesCpf && !matchesPhone) return false;
        }

        if (filter === 'all') return true;
        if (filter === 'balance') return client.balance > 0;
        if (filter === 'expiring') {
            try {
                const [day, month, year] = client.nextExpiration.split('/').map(Number);
                const expDate = new Date(year, month - 1, day);
                const today = new Date();
                const diffTime = expDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays >= 0;
            } catch (e) { return false; }
        }
        if (filter === 'vip') return client.totalAccumulated >= 500; // Mock VIP threshold
        return true;
    });

    return (
        <div className="px-6 max-w-7xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50 mb-2">Fidelidade & Cashback</h1>
                    <p className="text-gray-500 dark:text-zinc-400 font-medium">Gestão de saldo e recompensas dos clientes</p>
                </div>
                <button className="bg-slate-800 dark:bg-zinc-50 dark:text-black text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <span className="material-icons">download</span>
                    Exportar Relatório
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 p-6 rounded-xl hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0]">
                                <Wallet size={32} weight="duotone" className="stroke-current text-[#92FFAD]" />
                            </span>
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Saldo em Poder dos Clientes</h3>
                    <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
                        {loading ? '...' : `R$ ${metrics.totalLiability.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">Passivo acumulado (Cashback não utilizado)</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 p-6 rounded-xl hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0]">
                                <Coins size={32} weight="duotone" className="stroke-current text-[#92FFAD]" />
                            </span>
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Resgatado este Mês</h3>
                    <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
                        {loading ? '...' : `R$ ${metrics.redeemedMonth.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1">
                        <span className="material-icons text-sm">trending_up</span>
                        +12% vs mês anterior
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 p-6 rounded-xl hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0]">
                                <Clock size={32} weight="duotone" className="stroke-current text-[#92FFAD]" />
                            </span>
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Créditos Expirando (30d)</h3>
                    <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
                        {loading ? '...' : `R$ ${metrics.expiringSoon.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-red-500 mt-2 font-bold cursor-pointer hover:underline">Ver 12 clientes afetados</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-[#333333] dark:border-zinc-800 shadow-sm overflow-x-auto max-w-full">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'balance', label: 'Com Saldo' },
                        { id: 'expiring', label: 'Vencendo' },
                        { id: 'vip', label: 'Top VIPs' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === f.id
                                ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black shadow-lg shadow-[#92FFAD]/20'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-zinc-400'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <MagnifyingGlass className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-zinc-50 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="font-bold text-lg dark:text-zinc-50 flex items-center gap-2">
                        Carteira de Clientes
                    </h2>
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{filteredClients.length} Clientes listados</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
                            <tr>
                                <th className="p-4 pl-6 border-b border-gray-200 dark:border-zinc-800">Cliente</th>
                                <th className="p-4 border-b border-gray-200 dark:border-zinc-800">Saldo Disponível</th>
                                <th className="p-4 border-b border-gray-200 dark:border-zinc-800">Acumulado Total</th>
                                <th className="p-4 border-b border-gray-200 dark:border-zinc-800">Última Visita</th>
                                <th className="p-4 border-b border-gray-200 dark:border-zinc-800">Próxima Expiração</th>
                                <th className="p-4 pr-6 border-b border-gray-200 dark:border-zinc-800 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-zinc-700" />
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-zinc-50 text-sm">{client.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-400">{client.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded inline-block w-fit">
                                                R$ {client.balance.toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-600 dark:text-zinc-400">
                                        R$ {client.totalAccumulated.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 dark:text-zinc-500">
                                        {client.lastVisit}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 dark:text-zinc-500">
                                        {client.nextExpiration}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenAdjust(client)}
                                                className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                title="Ajuste Manual"
                                            >
                                                <Funnel size={18} weight="bold" />
                                            </button>
                                            <button
                                                onClick={() => onViewClientProfile && onViewClientProfile(client.id)}
                                                className="text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-primary border border-gray-200 dark:border-zinc-700 hover:border-primary rounded-lg px-3 py-1.5 transition-all"
                                            >
                                                Ver Extrato
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Mock) */}
                <div className="p-4 border-t border-studio-gray flex justify-center text-xs text-gray-500">
                    Mostrando {filteredClients.length} de {clients.length} clientes
                </div>
            </div>

            {/* Adjustment Modal */}
            {isAdjustModalOpen && selectedClientForAdjust && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdjustModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg dark:text-zinc-50">Ajuste Manual de Saldo</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/30 p-4 rounded-xl mb-6 flex items-center gap-4 border border-gray-200 dark:border-zinc-800/50">
                            <img src={selectedClientForAdjust.avatar} className="w-12 h-12 rounded-full" />
                            <div>
                                <p className="font-bold dark:text-zinc-50">{selectedClientForAdjust.name}</p>
                                <p className="text-xs text-slate-500">Saldo Atual: <strong className="text-emerald-500">R$ {selectedClientForAdjust.balance.toFixed(2)}</strong></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => setAdjustType('CREDIT')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${adjustType === 'CREDIT'
                                    ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                                    : 'border-gray-200 dark:border-zinc-800 text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <Plus size={18} weight="bold" /> Adicionar
                            </button>
                            <button
                                onClick={() => setAdjustType('DEBIT')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${adjustType === 'DEBIT'
                                    ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                                    : 'border-gray-200 dark:border-zinc-800 text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <Minus size={18} weight="bold" /> Remover
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Valor (R$)</label>
                                <input
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-lg font-bold outline-none focus:ring-2 focus:ring-primary dark:text-zinc-50"
                                    placeholder="0,00"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Motivo</label>
                                <input
                                    type="text"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-primary dark:text-zinc-50"
                                    placeholder="Ex: Bônus por indicação, Correção..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsAdjustModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={confirmAdjustment} className="flex-1 py-3 font-bold bg-[#333333] hover:bg-black text-white rounded-xl shadow-lg transition-transform hover:scale-[1.02]">Confirmar Ajuste</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loyalty;

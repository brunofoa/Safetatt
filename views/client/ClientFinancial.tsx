import React, { useState } from 'react';

const ClientFinancial: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-zinc-900">Financeiro</h2>
                <button className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-600 hover:bg-zinc-200 transition-colors">
                    <span className="material-icons text-lg">filter_list</span>
                </button>
            </header>

            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                    Pendentes
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'completed' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                    Realizados
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'pending' ? (
                    // Pending Items
                    <div className="space-y-3">
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-red-500/20 p-5 rounded-2xl relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h4 className="font-bold text-white text-lg">Sessão #2 Costas</h4>
                                    <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                                        <span className="material-icons text-[10px]">warning</span>
                                        Vence hoje
                                    </p>
                                </div>
                                <span className="font-bold text-xl text-white">R$ 400,00</span>
                            </div>

                            <button className="w-full py-3 bg-white text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
                                <span className="material-icons text-sm">content_copy</span>
                                Copiar Código PIX
                            </button>
                        </div>
                    </div>
                ) : (
                    // Completed Items
                    <div className="space-y-3">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#333333] hover:border-black transition-colors shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                        <span className="material-icons text-lg">check</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-zinc-900">Entrada - Leão</p>
                                        <p className="text-[10px] text-zinc-500">12 Set • Cartão de Crédito</p>
                                    </div>
                                </div>
                                <span className="font-bold text-sm text-zinc-700">R$ 800,00</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientFinancial;

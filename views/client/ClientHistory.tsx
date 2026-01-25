import React from 'react';

const MOCK_HISTORY = [
    {
        id: 1,
        title: 'Fechamento Costas',
        date: '12 Set 2024',
        artist: 'Kevin Ferguson',
        value: 'R$ 1.200,00',
        thumbnail: 'https://picsum.photos/seed/tattoo1/200/200',
        status: 'Concluído'
    },
    {
        id: 2,
        title: 'Leão Realista',
        date: '15 Ago 2024',
        artist: 'Kevin Ferguson',
        value: 'R$ 800,00',
        thumbnail: 'https://picsum.photos/seed/tattoo2/200/200',
        status: 'Concluído'
    },
    {
        id: 3,
        title: 'Minimalista Pulso',
        date: '20 Jul 2024',
        artist: 'Sarah Ink',
        value: 'R$ 350,00',
        thumbnail: 'https://picsum.photos/seed/tattoo3/200/200',
        status: 'Concluído'
    }
];

const ClientHistory: React.FC = () => {
    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-2xl font-bold text-zinc-900">Meu Histórico</h2>
                <p className="text-zinc-500 text-sm">Sua jornada de arte na pele.</p>
            </header>

            <div className="relative pl-4 space-y-8 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-zinc-200">
                {MOCK_HISTORY.map((item, i) => (
                    <div key={item.id} className="relative pl-12">
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[54px] z-10 flex justify-center">
                            <div className="w-4 h-4 rounded-full bg-white border-[3px] border-primary shadow-[0_0_10px_rgba(56,255,160,0.5)]"></div>
                        </div>

                        {/* Card */}
                        <div className="bg-white border border-[#333333] p-4 rounded-2xl flex items-center gap-4 hover:border-black transition-colors group shadow-sm">
                            <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0 border border-zinc-200">
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-zinc-900 truncate pr-2">{item.title}</h4>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {item.value}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1">
                                    <span className="material-icons text-[10px]">person</span>
                                    {item.artist}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                    {item.date}
                                </p>
                            </div>

                            <button className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors">
                                <span className="material-icons text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientHistory;

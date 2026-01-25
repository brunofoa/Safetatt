import React, { useState } from 'react';

const CARE_TOPICS = [
    {
        id: 'food',
        title: 'Alimentação',
        icon: 'restaurant',
        description: 'Evite alimentos gordurosos e carne de porco nos primeiros 7-10 dias. Estes alimentos podem retardar a cicatrização e aumentar o risco de inflamação. Prefira uma dieta equilibrada e beba bastante água.'
    },
    {
        id: 'exercise',
        title: 'Exercício físico',
        icon: 'fitness_center',
        description: 'Evite exercícios intensos que causem suor excessivo ou esticamento da pele na área tatuada por pelo menos 1 semana. O suor pode irritar a tatuagem e o atrito pode prejudicar a cicatrização.'
    },
    {
        id: 'sun_water',
        title: 'Praia e piscina',
        icon: 'beach_access',
        description: 'Proibido praia, piscina, sauna e banhos de imersão por 30 dias. O risco de infecção bacteriana é alto e o sol (mesmo com protetor) pode danificar o pigmento nesta fase inicial.'
    },
    {
        id: 'skin',
        title: 'Cuidados pele',
        icon: 'water_drop',
        description: 'Mantenha a tatuagem limpa e hidratada. Use a pomada recomendada pelo tatuador 3x ao dia. Não coce e não arranque as casquinhas, deixe que caiam naturalmente para não falhar a tinta.'
    },
    {
        id: 'alcohol',
        title: 'Bebida alcoólica',
        icon: 'local_bar',
        description: 'Evite consumo excessivo de álcool nos primeiros 3 dias. O álcool afina o sangue (aumentando a saída de plasma) e desidrata o corpo, o que pode prejudicar o processo de cicatrização.'
    },
    {
        id: 'clothes',
        title: 'Roupas',
        icon: 'checkroom',
        description: 'Use roupas leves, largas e de algodão que não apertem a região tatuada. Evite tecidos sintéticos ou ásperos que possam grudar ou causar atrito excessivo na tatuagem recém-feita.'
    }
];

const ClientCare: React.FC = () => {
    const [selectedTopic, setSelectedTopic] = useState<typeof CARE_TOPICS[0] | null>(null);

    return (
        <div className="space-y-8 pb-10">
            {/* Header & Disclaimer */}
            <div className="text-center space-y-4 px-2">
                <h2 className="text-3xl font-bold text-zinc-900">Cuidados pós tatuagem</h2>

                <div className="space-y-2">
                    <p className="text-zinc-500 text-sm tracking-wide font-bold">
                        Atenção, por favor!
                    </p>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-xl mx-auto">
                        Esta informação não substitui aconselhamento de um médico. A Safetatt, eximi-se de qualquer responsabilidade pelas decisões que você toma utilizando essas informações como base.
                    </p>
                </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CARE_TOPICS.map((topic) => (
                    <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className="bg-white border border-[#333333] p-6 rounded-2xl flex items-center gap-4 hover:border-black hover:bg-zinc-50 hover:shadow-md transition-all group text-left"
                    >
                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                            <span className="material-icons text-4xl text-zinc-800 group-hover:scale-110 transition-transform duration-300">
                                {topic.icon}
                            </span>
                        </div>
                        <span className="text-lg font-medium text-zinc-700 group-hover:text-black">
                            {topic.title}
                        </span>
                    </button>
                ))}
            </div>

            {/* Modal for Details (invoked by clicking a card) */}
            {selectedTopic && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTopic(null)}></div>
                    <div className="bg-white border border-[#333333] w-full max-w-md rounded-[2rem] p-8 relative z-10 animate-in fade-in zoom-in duration-200 shadow-2xl">
                        <button
                            onClick={() => setSelectedTopic(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors"
                        >
                            <span className="material-icons">close</span>
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <span className="material-icons text-5xl text-zinc-900 mb-4">{selectedTopic.icon}</span>
                            <h3 className="text-2xl font-bold text-zinc-900">{selectedTopic.title}</h3>
                        </div>

                        <p className="text-zinc-600 text-base leading-relaxed text-center">
                            {selectedTopic.description}
                        </p>

                        <button
                            onClick={() => setSelectedTopic(null)}
                            className="w-full mt-8 bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientCare;

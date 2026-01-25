
import React, { useState } from 'react';

interface NewAppointmentProps {
  onFinish: () => void;
  onCancel: () => void;
}

const NewAppointment: React.FC<NewAppointmentProps> = ({ onFinish, onCancel }) => {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState('tattoo');
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Cast explicitly to File[] to avoid TS inference issues with Blob props
      const newFiles = Array.from(e.target.files) as File[];
      const remainingSlots = 5 - photos.length;
      const filesToProcess = newFiles.slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-zinc-50 mb-2 capitalize tracking-tight">Realizar Atendimento</h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">Identifique o cliente e o serviço a ser realizado.</p>
            <div className="space-y-6">
              <div className="relative">
                <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Título do Atendimento</label>
                <input className="block w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all" placeholder={serviceType === 'tattoo' ? "Ex: Tattoo de Leão Braço" : "Ex: Piercing no Septo"} type="text" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Tipo de Serviço</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="block w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="tattoo">Tatuagem</option>
                    <option value="piercing">Piercing</option>
                  </select>
                  <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Profissional</label>
                  <select className="block w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
                    <option>Kevin Ferguson</option>
                    <option>Marcus Volt</option>
                    <option>Alex Rivera</option>
                    <option>Elena Vanc</option>
                  </select>
                  <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Busca de Cliente</label>
                <div className="relative">
                  <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                  <input className="block w-full border border-gray-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Nome, CPF ou E-mail..." type="text" />
                </div>
              </div>
            </div>
          </div >
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-zinc-50 mb-2 capitalize tracking-tight">
              {serviceType === 'tattoo' ? 'Informações da Tatuagem' : 'Informações do Piercing'}
            </h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">Detalhes técnicos, artísticos e financeiros.</p>

            {serviceType === 'tattoo' ? (
              // TATTOO FORM
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Local do corpo</label>
                    <input className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Antebraço interno" type="text" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Tamanho Estimado</label>
                    <select className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer">
                      <option>Pequeno (até 5cm)</option>
                      <option>Médio (até 15cm)</option>
                      <option>Grande (mais de 15cm)</option>
                      <option>Fechamento (Sessões)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Cor da Arte</label>
                    <select className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer">
                      <option>Preta (Blackwork)</option>
                      <option>Colorida</option>
                      <option>Sombreada (Black & Grey)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Sessão</label>
                    <input className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: 1ª de 3" type="text" />
                  </div>
                </div>
              </>
            ) : (
              // PIERCING FORM
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Local do corpo</label>
                    <input className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Septo, Orelha, Umbigo" type="text" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Jóia Utilizada</label>
                    <input className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Argola Titânio 8mm" type="text" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Descrição detalhada</label>
              <textarea rows={3} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" placeholder={serviceType === 'tattoo' ? "Descreva detalhes da arte, referências, estilo..." : "Detalhes sobre a perfuração, calibre da agulha, etc..."} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">{serviceType === 'tattoo' ? 'Fotos de Referência' : 'Foto da Jóia/Local'}</label>

              <div className="space-y-4">
                {/* Photo Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4 animate-fade-in">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group shadow-md border border-gray-200 dark:border-zinc-800">
                        <img src={photo} alt={`Referência ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 shadow-sm"
                        >
                          <span className="material-icons text-xs block">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {photos.length < 5 && (
                  <div>
                    <input
                      type="file"
                      id="photo-upload"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all group"
                    >
                      <span className="material-icons text-3xl text-gray-300 group-hover:text-primary mb-2 transition-colors">add_a_photo</span>
                      <span className="text-xs text-gray-400 font-bold group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors">
                        {photos.length === 0 ? 'Clique para adicionar fotos' : 'Adicionar mais fotos'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">Máximo 5 fotos</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Valor do Procedimento</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-lg font-bold" placeholder="0,00" type="text" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-zinc-50 mb-2 capitalize tracking-tight">Ficha de Anamnese</h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">Informações de saúde e segurança do cliente.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Possui alergias?', 'Problemas de coagulação?', 'Hepatite?', 'HIV?', 'Está grávida?', 'Diabetes?', 'Epilepsia?', 'Problemas cardíacos?'].map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{item}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Observações de Saúde</label>
              <textarea rows={4} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" placeholder="Liste medicamentos, alergias específicas ou detalhes importantes..." />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-zinc-50 mb-2 capitalize tracking-tight">Termo & Assinatura</h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">O cliente deve ler e assinar para concordar com o procedimento.</p>

            <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 max-h-60 overflow-y-auto text-xs leading-relaxed text-gray-600 dark:text-gray-400 custom-scrollbar mb-6">
              <p className="mb-4 font-bold uppercase">1. CONSENTIMENTO LIVRE E ESCLARECIDO</p>
              <p className="mb-4">
                Pelo presente Termo de Responsabilidade, eu declaro estar de acordo com todas as condições estabelecidas abaixo para a realização de procedimento de tatuagem. Estou ciente de que a pigmentação artificial da pele é um procedimento invasivo e permanente.
              </p>
              <p className="mb-4">
                Declaro não sofrer de doenças infectocontagiosas, alergias severas a pigmentos ou problemas de coagulação que impeçam o procedimento.
              </p>
              <p className="mb-4 font-bold uppercase">2. CUIDADOS PÓS-PROCEDIMENTO</p>
              <p>
                Comprometo-me a seguir todas as orientações de higiene e cuidados fornecidas pelo artista para garantir a correta cicatrização da arte.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-4 tracking-[0.2em] text-center">ASSINATURA DIGITAL DO CLIENTE</label>
              <div className="w-full h-48 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 relative flex items-center justify-center cursor-crosshair group overflow-hidden hover:border-primary transition-colors">
                <span className="text-gray-400 italic font-medium group-hover:text-primary transition-colors pointer-events-none">Assine aqui usando o dedo ou mouse</span>
              </div>
              <button className="mt-4 text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-wider">Limpar Assinatura</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl pb-10">
      <div className="mb-12">
        <div className="flex justify-between relative">
          {[1, 2, 3, 4].map((s) => {
            const isCompleted = step > s;
            const isActive = step === s;
            const isPending = step < s;

            return (
              <div key={s} className="flex flex-col items-center flex-1 space-y-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-300 ${isCompleted
                  ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-none'
                  : isActive
                    ? 'bg-primary text-black scale-110 shadow-lg'
                    : 'bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 text-slate-400'
                  }`}>
                  {isCompleted ? <span className="material-icons text-base">check</span> : s}
                </div>
                <span className={`text-[10px] font-bold tracking-widest text-center ${isActive || isCompleted ? 'text-slate-900 dark:text-zinc-50' : 'text-slate-400'
                  }`}>
                  {s === 1 ? 'IDENTIFICAÇÃO' : s === 2 ? 'DETALHES' : s === 3 ? 'ANAMNESE' : 'ASSINATURA'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-[500px]">
        <div className="absolute top-0 left-0 w-1 h-full btn-gradient"></div>
        {renderStep()}
      </div>

      <div className="mt-10 flex flex-col md:flex-row gap-4 justify-between items-center">
        <button
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="w-full md:w-48 px-8 py-4 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-600 dark:text-gray-400 font-bold text-xs tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
        >
          {step === 1 ? 'CANCELAR' : 'VOLTAR'}
        </button>
        <button
          onClick={step === 4 ? onFinish : () => setStep(step + 1)}
          className="btn-gradient w-full md:w-64 px-8 py-4 rounded-2xl text-black font-extrabold text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {step === 4 ? 'FINALIZAR' : 'PRÓXIMA ETAPA'}
          <span className="material-icons text-sm">{step === 4 ? 'done_all' : 'arrow_forward'}</span>
        </button>
      </div>
    </div>
  );
};

export default NewAppointment;

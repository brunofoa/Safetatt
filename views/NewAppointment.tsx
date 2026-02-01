import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../contexts/AuthContext';
import { studioService } from '../services/studioService';
import { clientService } from '../services/clientService';
import { teamService } from '../services/teamService';
import { appointmentService } from '../services/appointmentService';
import { sessionService } from '../services/sessionService';
import { anamnesisService } from '../services/anamnesisService';
import { Client } from '../types';

interface NewAppointmentProps {
  onFinish: () => void;
  onCancel: () => void;
}

const NewAppointment: React.FC<NewAppointmentProps> = ({ onFinish, onCancel }) => {
  const { currentStudio, session } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Identification State
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('tattoo');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [artists, setArtists] = useState<any[]>([]);

  // Client Search State
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientsFound, setClientsFound] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  // Step 2: Details State
  const [bodyPart, setBodyPart] = useState('');
  const [size, setSize] = useState('Médio (até 15cm)');
  const [artColor, setArtColor] = useState('Preta (Blackwork)');
  const [sessionInfo, setSessionInfo] = useState('1ª de 1');

  // Piercing specific
  const [piercingJewelry, setPiercingJewelry] = useState('');

  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 3: Anamnesis State
  const [anamnesisItems, setAnamnesisItems] = useState<string[]>([]);
  const [anamnesisAnswers, setAnamnesisAnswers] = useState<Record<string, boolean>>({});
  const [anamnesisObs, setAnamnesisObs] = useState('');

  // Step 4: Signature
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // State for Full Studio Details (Address, CNPJ)
  const [fullStudio, setFullStudio] = useState<any>(null);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      if (!currentStudio?.id) return;

      // Load full studio settings/details
      const settings = await studioService.getStudioSettings(currentStudio.id);
      setFullStudio(settings || currentStudio); // Fallback to auth context version if fetch fails

      if (settings?.settings_anamnesis && Array.isArray(settings.settings_anamnesis)) {
        setAnamnesisItems(settings.settings_anamnesis);
      } else {
        setAnamnesisItems(['Diabetes', 'Hipertensão', 'Alergias', 'Hepatite', 'HIV', 'Problemas Dermatológicos']);
      }

      // Load Artists
      const members = await teamService.getTeamMembers(currentStudio.id);
      // Filter only artists/masters if possible, for now all members
      setArtists(members);

      // Auto-select current user if in list, otherwise first
      if (members.length > 0) {
        // Find member matching current user
        const me = members.find(m => m.email === session?.user?.email);
        if (me) setSelectedArtist(me.profile_id);
        else setSelectedArtist(members[0].profile_id);
      }
    };
    loadData();
  }, [currentStudio, session]);

  // ... (Keep existing code)

  const getReplacedTerm = () => {
    const artistObj = artists.find(a => a.profile_id === selectedArtist);

    let term = `Pelo presente Termo de Responsabilidade, eu, {{NOME_CLIENTE}}, portador(a) do CPF nº {{CPF_CLIENTE}}, declaro estar de acordo com todas as condições estabelecidas abaixo para a realização de procedimento de tatuagem no estúdio {{NOME_ESTUDIO}}, localizado em: {{ENDERECO_ESTUDIO}}, {{CIDADE_ESTUDIO}}, {{ESTADO_ESTUDIO}}, inscrito no CNPJ nº {{CNPJ_ESTUDIO}}, sob responsabilidade do(a) profissional {{NOME_TATUADOR}}, CPF nº {{CPF_TATUADOR}}, doravante denominado(a) “Tatuador(a)”.

1. Estou em plenas condições físicas e mentais para realizar o procedimento, e informei ao tatuador(a) todas as minhas condições de saúde relevantes. “Doenças como diabetes, hemofilia, imunossupressão, problemas dermatológicos, uso de medicamentos contínuos, entre outros, foram devidamente comunicados.”
2. Não estou sob efeito de substâncias psicoativas, como álcool, drogas ou medicamentos que possam afetar minha consciência no momento da assinatura deste termo.
3. Autorizo, de livre e espontânea vontade, a realização do procedimento de tatuagem no(s) local(is) previamente combinado(s), com o desenho aprovado por mim.
4. Tenho ciência de que a tatuagem é um procedimento invasivo, que envolve o uso de agulhas para inserção de pigmentos na pele, podendo causar dor, inchaço, sangramento, crostas, manchas, alergias, inflamações e cicatrizes.
5. Reconheço que a tatuagem é um trabalho manual e artesanal, podendo haver variações de simetria, tonalidade, alinhamento e pigmentação em relação à arte original. Concordo que tais variações não configuram erro profissional.
6. Estou ciente de que não há garantia de perfeição estética ou resultado final exato, por se tratar de um procedimento artístico, que depende da resposta biológica individual.
7. Declaro estar ciente de que não caberá reembolso da tatuagem por insatisfação estética resultante de expectativas pessoais ou variações naturais da cicatrização. Essa cláusula está respaldada no artigo 14, §1º, do Código de Defesa do Consumidor (Lei 8.078/90), considerando a natureza subjetiva do serviço artístico e a ausência de defeito técnico.
8. Recebi todas as orientações sobre os cuidados com a tatuagem após sua realização.
9. Estou ciente de que a má cicatrização, exposição solar, coceira, traumas locais e o uso de produtos inadequados podem comprometer o resultado final.
10. O procedimento de retoque não é automaticamente obrigatório, e sua necessidade será avaliada exclusivamente pelo(a) tatuador(a), considerando os fatores técnicos e a fidelidade do cliente aos cuidados recomendados. A decisão sobre gratuidade ou cobrança será pautada na boa-fé, no tempo decorrido desde a realização da tatuagem, e na correta execução das orientações de pós-procedimento.
11. Conforme o artigo 20 do Código de Defesa do Consumidor, o prestador de serviço não poderá ser responsabilizado por falhas decorrentes de fatores externos ou má conservação por parte do cliente.
12. Autorizo o uso de imagens da tatuagem realizada para fins de divulgação profissional pelo tatuador e pelo estúdio.
13. Reconheço que o desenho criado ou adaptado para mim permanece como obra intelectual do tatuador, conforme a Lei de Direitos Autorais (Lei nº 9.610/98).
14. Declaro que, juntamente com este Termo de Responsabilidade, preenchi e assinei corretamente a ficha de cadastro e a ficha de anamnese, fornecendo informações verdadeiras e completas.
15. Estou ciente de que esses documentos fazem parte do meu prontuário e possuem validade jurídica, podendo ser utilizados como complemento ou comprovação deste termo.`;

    // Replacements
    term = term.replace('{{NOME_CLIENTE}}', selectedClient?.name || '__________________________');
    term = term.replace('{{CPF_CLIENTE}}', selectedClient?.cpf || '__________________');

    term = term.replace('{{NOME_ESTUDIO}}', fullStudio?.name || 'Safetatt Studio');
    const address = fullStudio?.address_street
      ? `${fullStudio.address_street}, ${fullStudio.address_number || ''}`
      : 'Endereço não cadastrado';
    term = term.replace('{{ENDERECO_ESTUDIO}}', address);
    term = term.replace('{{CIDADE_ESTUDIO}}', fullStudio?.city || '________________');
    term = term.replace('{{ESTADO_ESTUDIO}}', fullStudio?.state || '__');
    term = term.replace('{{CNPJ_ESTUDIO}}', fullStudio?.cnpj || '__________________');

    term = term.replace('{{NOME_TATUADOR}}', artistObj?.full_name || '__________________________');
    term = term.replace('{{CPF_TATUADOR}}', artistObj?.cpf || '__________________');

    return term;
  };



  // Client Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (clientSearchQuery.length >= 2 && currentStudio?.id) {
        setIsSearchingClient(true);
        const results = await clientService.searchClients(clientSearchQuery, currentStudio.id);
        setClientsFound(results);
        setIsSearchingClient(false);
      } else {
        setClientsFound([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [clientSearchQuery, currentStudio?.id]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearchQuery(client.name);
    setClientsFound([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignatureData(null);
  };

  const handleFinish = async () => {
    if (!selectedClient) {
      alert('Por favor, selecione um cliente.');
      setStep(1);
      return;
    }
    if (sigCanvas.current?.isEmpty()) {
      alert('A assinatura do cliente é obrigatória.');
      return;
    }

    setIsLoading(true);
    try {
      // Use standard output to avoid 'trim-canvas' dependency issues
      const signature = sigCanvas.current?.getCanvas().toDataURL('image/png') || '';
      const numericPrice = parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.') || '0');

      // Ensure selectedArtist matches a profile ID if possible, otherwise keep as is
      // Note: We're assuming the select value is already the profile_id as per previous fix
      const selectedArtistObj = artists.find(a => a.profile_id === selectedArtist);

      // 1. Create Session directly (Decoupled from Appointment)
      const sessionPayload = {
        studioId: currentStudio?.id,
        clientId: selectedClient.id,
        artistId: selectedArtist, // The member profile ID
        professional: selectedArtistObj?.full_name || 'Profissional',
        title: title || (serviceType === 'tattoo' ? 'Tatuagem' : 'Piercing'),
        // No startTime/endTime - it's a walk-in/session now
        status: 'draft', // Initial status
        service_type: serviceType === 'tattoo' ? 'tattoo' : 'piercing',
        description: description, // Clean description

        // Add missing fields to payload
        body_location: bodyPart,
        size: serviceType === 'tattoo' ? size : null,
        art_color: serviceType === 'tattoo' ? artColor : null,
        price: price,
        photos: photos,
        session_number: serviceType === 'tattoo' ? (parseInt(sessionInfo.replace(/\D/g, '')) || 1) : null,
        technical_details: (serviceType === 'piercing' && piercingJewelry) ? { jewelry: piercingJewelry } : null,
        consent_signature_url: signature,
      };

      const appRes = await sessionService.createSession(sessionPayload);

      if (!appRes.success || !appRes.data) {
        throw new Error('Erro ao criar atendimento: ' + (appRes.error?.message || 'Unknown'));
      }

      const sessionId = appRes.data.id;

      // 2. Save Anamnesis + Signature
      const anamnesisRes = await anamnesisService.saveAnswers(sessionId, anamnesisAnswers, anamnesisObs, currentStudio?.id || '');

      if (!anamnesisRes.success) {
        console.error('Erro anamnese:', anamnesisRes.error);
        alert(`Atenção: Atendimento criado, mas erro ao salvar Anamnese: ${anamnesisRes.error?.message || JSON.stringify(anamnesisRes.error)}`);
      } else if (anamnesisRes.data) {
        // Update Session with Anamnesis ID
        await sessionService.updateSession(sessionId, { anamnesis_id: anamnesisRes.data.id });
      }

      alert('Atendimento iniciado com sucesso! ID: ' + sessionId);
      onFinish();

    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
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
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="block w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder={serviceType === 'tattoo' ? "Ex: Tattoo de Leão Braço" : "Ex: Piercing no Septo"}
                  type="text"
                />
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
                  <select
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                    className="block w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    {artists.map(artist => (
                      <option key={artist.id} value={artist.profile_id}>{artist.full_name}</option>
                    ))}
                  </select>
                  <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Busca de Cliente</label>
                <div className="relative group">
                  <input
                    value={selectedClient ? selectedClient.name : clientSearchQuery}
                    onChange={e => {
                      setClientSearchQuery(e.target.value);
                      setSelectedClient(null); // Reset selection on type
                    }}
                    className={`block w-full border ${selectedClient ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-zinc-800'} rounded-xl pl-12 pr-4 py-4 text-gray-900 dark:text-zinc-50 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all`}
                    placeholder="Nome, CPF ou E-mail..."
                    type="text"
                  />
                  {selectedClient && (
                    <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-green-500">check_circle</span>
                  )}
                  {/* Results Dropdown */}
                  {!selectedClient && clientsFound.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-50 overflow-hidden">
                      {clientsFound.map(client => (
                        <div
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer border-b border-gray-50 dark:border-zinc-700/50 last:border-none flex justify-between items-center"
                        >
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{client.name}</span>
                          <span className="text-xs text-gray-400">{client.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!selectedClient && isSearchingClient && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-xl z-50 text-center text-xs text-gray-400">
                      Buscando...
                    </div>
                  )}
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
                    <input value={bodyPart} onChange={e => setBodyPart(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Antebraço interno" type="text" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Tamanho Estimado</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer">
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
                    <select value={artColor} onChange={e => setArtColor(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer">
                      <option>Preta (Blackwork)</option>
                      <option>Colorida</option>
                      <option>Sombreada (Black & Grey)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Sessão</label>
                    <input value={sessionInfo} onChange={e => setSessionInfo(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: 1ª de 3" type="text" />
                  </div>
                </div>
              </>
            ) : (
              // PIERCING FORM
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Local do corpo</label>
                    <input value={bodyPart} onChange={e => setBodyPart(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Septo, Orelha, Umbigo" type="text" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Jóia Utilizada</label>
                    <input value={piercingJewelry} onChange={e => setPiercingJewelry(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Argola Titânio 8mm" type="text" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Descrição detalhada</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" placeholder={serviceType === 'tattoo' ? "Descreva detalhes da arte, referências, estilo..." : "Detalhes sobre a perfuração, calibre da agulha, etc..."} />
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
                <input value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-lg font-bold" placeholder="0,00" type="text" />
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
              {anamnesisItems.map((item, idx) => (
                <label key={idx} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${anamnesisAnswers[item] ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : 'border-gray-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800'}`}>
                  <input
                    type="checkbox"
                    checked={!!anamnesisAnswers[item]}
                    onChange={() => setAnamnesisAnswers({ ...anamnesisAnswers, [item]: !anamnesisAnswers[item] })}
                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className={`text-sm font-medium ${anamnesisAnswers[item] ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'}`}>{item}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block tracking-widest">Observações de Saúde</label>
              <textarea
                value={anamnesisObs}
                onChange={e => setAnamnesisObs(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-4 bg-transparent text-gray-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                placeholder="Liste medicamentos, alergias específicas ou detalhes importantes..."
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-zinc-50 mb-2 capitalize tracking-tight">Termo & Assinatura</h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">O cliente deve ler e assinar para concordar com o procedimento.</p>

            <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 max-h-80 overflow-y-auto text-xs leading-relaxed text-gray-600 dark:text-gray-400 custom-scrollbar mb-6 whitespace-pre-wrap">
              {getReplacedTerm()}
            </div>

            <div className="flex flex-col items-center">
              <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-4 tracking-[0.2em] text-center">ASSINATURA DIGITAL DO CLIENTE</label>
              <div className="w-full h-48 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 relative overflow-hidden hover:border-black dark:hover:border-zinc-50 transition-colors">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#000000"
                  canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  backgroundColor='rgba(0,0,0,0)'
                />
              </div>
              <button onClick={clearSignature} className="mt-4 text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-wider">Limpar Assinatura</button>
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
          disabled={isLoading}
          className="w-full md:w-48 px-8 py-4 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-600 dark:text-gray-400 font-bold text-xs tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {step === 1 ? 'CANCELAR' : 'VOLTAR'}
        </button>
        <button
          onClick={step === 4 ? handleFinish : () => setStep(step + 1)}
          disabled={isLoading}
          className="btn-gradient w-full md:w-64 px-8 py-4 rounded-2xl text-black font-extrabold text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'SALVANDO...' : step === 4 ? 'FINALIZAR' : 'PRÓXIMA ETAPA'}
          {!isLoading && <span className="material-icons text-sm">{step === 4 ? 'done_all' : 'arrow_forward'}</span>}
        </button>
      </div>
    </div>
  );
};

export default NewAppointment;

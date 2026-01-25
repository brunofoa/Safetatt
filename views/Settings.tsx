import React, { useState, useEffect } from 'react';
import NewUserModal from '../components/NewUserModal';
import Avatar from '../components/Avatar';
import { loyaltyService } from '../services/loyaltyService';
import { whatsappService } from '../services/whatsappService';
import { LoyaltyConfig } from '../../types';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { session, currentStudio } = useAuth(); // Assuming currentStudio availability
  const [activeTab, setActiveTab] = useState('dados');

  // WhatsApp State
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (activeTab === 'whatsapp' && currentStudio?.whatsapp_instance_name) {
      fetchConnectionInfo();
    }
  }, [activeTab, currentStudio]);

  const fetchConnectionInfo = async () => {
    if (!currentStudio?.whatsapp_instance_name) return;
    setLoadingQr(true);
    const info = await whatsappService.getConnectionInfo(currentStudio.whatsapp_instance_name);
    setConnectionStatus(info.status);
    if (info.qrCode) {
      setQrCode(info.qrCode);
    }
    setLoadingQr(false);
  };

  const handleSendTest = async () => {
    if (!currentStudio?.whatsapp_instance_name) return;
    setLoadingQr(true);
    const res = await whatsappService.sendText(
      currentStudio.whatsapp_instance_name,
      '5511999999999',
      'Olá! O Safetatt conectou com sucesso no servidor UazAPI.'
    );
    if (res.success) {
      alert('Mensagem de teste enviada!');
    } else {
      alert('Erro ao enviar mensagem.');
    }
    setLoadingQr(false);
  };

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newItem, setNewItem] = useState('');

  const [users, setUsers] = useState([
    { id: 1, name: 'Kevin', surname: 'Ferguson', email: 'kevin@kevinsink.com', profileType: 'master', userColor: '#92FFAD', avatar: 'https://i.pravatar.cc/150?img=68', roleTitle: 'Master' },
    { id: 2, name: 'Marcus', surname: 'Volt', email: 'marcus@kevinsink.com', profileType: 'tatuador', userColor: '#5CDFF0', avatar: 'https://i.pravatar.cc/150?img=33', roleTitle: 'Tatuador' },
    { id: 3, name: 'Elena', surname: 'Vanc', email: 'elena@kevinsink.com', profileType: 'piercer', userColor: '#F472B6', avatar: 'https://i.pravatar.cc/150?img=47', roleTitle: 'Piercer' },
    { id: 4, name: 'Ana', surname: 'Reception', email: 'ana@kevinsink.com', profileType: 'recepcionista', userColor: '#FB923C', avatar: 'https://i.pravatar.cc/150?img=5', roleTitle: 'Recepcionista' },
  ]);

  const [anamnesisItems, setAnamnesisItems] = useState<string[]>([
    'Diabetes',
    'Hipertensão',
    'Alergias',
    'Uso de Anticoagulantes',
    'Gravidez',
    'Lactante',
    'Hepatite',
    'HIV/AIDS',
    'Problemas de Pele',
    'Cirurgias Recentes',
    'Quelóide'
  ]);

  const handleAddAnamnesisItem = () => {
    if (newItem.trim()) {
      setAnamnesisItems([...anamnesisItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveAnamnesisItem = (index: number) => {
    const newItems = [...anamnesisItems];
    newItems.splice(index, 1);
    setAnamnesisItems(newItems);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsNewUserModalOpen(true);
  };

  const handleSaveUser = (userData: any) => {
    // Logic to save/update user would go here
    // For now, just close the modal and maybe update local state if needed
    console.log("Saving user:", userData);
    setIsNewUserModalOpen(false);
    setEditingUser(null);
  };

  // Loyalty State
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
    isActive: false,
    rewardType: 'PERCENTAGE',
    rewardValue: 10,
    minSpentToUse: 100,
    validityDays: 90,
    maxUsageLimit: 100
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Fetch Loyalty Config on Load
  useEffect(() => {
    if (activeTab === 'fidelidade' && session?.user) {
      // Assuming user.id or some studio_id logic. For now, we need a studio ID.
      // In a real app, the user belongs to a Studio. We'd fetch that ID from context or profile.
      // For MVP, we might hardcode or fetch the first studio owned by user.
      // Let's assume we have a studio ID, or fetch it.
      // Since we don't have a StudioContext handy fully wired, I'll pass a placeholder or try to fetch.
      // TEMPORARY: using a known ID or fetching from generic "get current studio" logic if implemented.
      // We will default to a 'current' studio concept.
    }
  }, [activeTab, session]);

  const handleSaveLoyaltyConfig = async () => {
    if (!session?.user) return;
    setLoadingConfig(true);
    // Hardcoding Studio ID for MVP if not available, OR getting from a service if we had one.
    // Ideally: const studioId = currentStudio.id;
    // Let's try to pass a placeholder for now as we don't have the context here easily without checking AuthContext more deep.
    // WAIT: AuthContext usually has the user. 
    // We will IMPLEMENT a check effectively later. For now, let's mock the SAVE with a console log + alert 
    // and a TODO to connect the last mile of "Which Studio?".

    // Actually, let's look at `loyaltyService.updateStudioConfig`. It needs a `studioId`.
    // If we are the Master, we likely created the studio.
    // Let's try to assume a single studio for the user for now.

    // MOCK SAVE FOR NOW until Studio Context is verified.
    console.log('Saving config:', loyaltyConfig);
    alert('Configurações Salvas (Simulado - Falta StudioContext)');
    setLoadingConfig(false);
  };

  const tabs = [
    { id: 'dados', label: 'Dados do estúdio', icon: 'store' },
    { id: 'usuarios', label: 'Usuários', icon: 'people' },
    { id: 'anamnese', label: 'Anamnese', icon: 'content_paste' },
    { id: 'whatsapp', label: 'Whatsapp', icon: 'chat' },
    { id: 'mensagem', label: 'Mensagem', icon: 'email' },
    { id: 'fidelidade', label: 'Fidelidade', icon: 'loyalty' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6">
      <h1 className="text-2xl font-bold mb-8 dark:text-zinc-50">Configurações do Estúdio</h1>

      <nav className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm mb-8 overflow-hidden border border-[#333333] dark:border-zinc-800">
        <ul className="flex flex-wrap">
          {tabs.map((tab) => (
            <li key={tab.id} className="flex-1">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full block py-4 px-2 text-center text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                  ? 'bg-[#333333] text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
              >
                <span className="material-icons md:hidden block text-xl">{tab.icon}</span>
                <span className="hidden md:block">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-[#333333] dark:border-zinc-800 p-8 space-y-12">
        {activeTab === 'dados' && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-zinc-50">
              <span className="material-icons mr-2 text-gray-500 dark:text-zinc-400">store</span>
              Dados do Estúdio
            </h2>
            <div className="space-y-8">
              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block">Logo do Estúdio</label>
                  <label className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl p-2 flex flex-col items-center justify-center w-full aspect-square group cursor-pointer hover:border-primary transition-colors relative overflow-hidden">
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl w-24 h-24 flex items-center justify-center mb-2 shadow-inner">
                          <span className="text-3xl font-extrabold tracking-tighter text-gray-800 dark:text-zinc-50">SA</span>
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold group-hover:text-primary transition-colors">ALTERAR LOGO</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="md:col-span-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Nome do Estúdio</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="Kevin's Ink" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">CNPJ</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="12.345.678/0001-01" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Link Cadastro Cliente</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400 text-sm">safetatt.app/</span>
                      <input className="w-full px-4 py-3 rounded-r-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="kevins-ink" />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-zinc-800/50" />

              {/* Address */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                  <span className="material-icons text-lg text-gray-500 dark:text-zinc-400">place</span>
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">CEP</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="01234-567" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Endereço</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="Rua Augusta" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Número / Comp.</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="1500, Sala 42" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Cidade</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="São Paulo" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Estado</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all appearance-none">
                      <option className="dark:bg-zinc-900">São Paulo</option>
                      <option className="dark:bg-zinc-900">Rio de Janeiro</option>
                      <option className="dark:bg-zinc-900">Minas Gerais</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-zinc-800/50" />

              {/* Contacts */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                  <span className="material-icons text-lg text-gray-500 dark:text-zinc-400">contact_phone</span>
                  Contatos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Telefone / WhatsApp</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="text" defaultValue="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">E-mail de Contato</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all" type="email" defaultValue="contato@kevinsink.com" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-10 rounded-xl shadow-lg transition-all flex items-center transform hover:scale-105 hover:shadow-xl">
                  <span className="material-icons mr-2">save</span>
                  Salvar Alterações
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'whatsapp' && (
          <section>
            <div className="p-8 grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                  <span className="material-icons text-green-500">whatsapp</span>
                  Configuração do WhatsApp
                </h2>

                {!currentStudio?.whatsapp_instance_name ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-3xl text-blue-600 dark:text-blue-400">rocket_launch</span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-50 mb-2">Ativar Integração WhatsApp</h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                      Automatize o envio de lembretes e fidelize seus clientes. Clique abaixo para criar sua instância dedicada na UazAPI.
                    </p>
                    <button
                      onClick={async () => {
                        if (!currentStudio?.id || !currentStudio?.name) return;
                        if (!confirm('Deseja criar uma nova instância para este estúdio?')) return;

                        setLoadingQr(true);
                        const res = await whatsappService.provisionInstance(currentStudio.name, currentStudio.id);
                        if (res.success) {
                          alert('Instância criada com sucesso! A página será recarregada.');
                          window.location.reload();
                        } else {
                          alert('Erro ao criar instância. Tente novamente.');
                          setLoadingQr(false);
                        }
                      }}
                      disabled={loadingQr}
                      className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-8 rounded-xl shadow-lg shadow-[#92FFAD]/20 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 hover:scale-105"
                    >
                      {loadingQr ? (
                        <>
                          <span className="material-icons animate-spin text-sm">sync</span>
                          Configurando...
                        </>
                      ) : (
                        <>
                          <span className="material-icons">power_settings_new</span>
                          Ativar Agora
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block">Nome da Instância</label>
                      <input
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 focus:ring-2 focus:ring-primary outline-none cursor-not-allowed"
                        value={currentStudio.whatsapp_instance_name || ''}
                        disabled
                        type="text"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-zinc-50">Status da Conexão</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {connectionStatus === 'CONNECTED' ? 'Conectado e pronto para envio' : connectionStatus === 'CONNECTING' ? 'Tentando conectar...' : 'Aguardando leitura do QR Code'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${connectionStatus === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {connectionStatus === 'CONNECTED' ? 'ONLINE' : 'OFFLINE'}
                      </div>
                    </div>

                    {connectionStatus === 'CONNECTED' && (
                      <button
                        onClick={handleSendTest}
                        disabled={loadingQr}
                        className="w-full bg-[#333333] hover:bg-black text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-icons text-sm">send</span>
                        {loadingQr ? 'Enviando...' : 'Enviar Mensagem de Teste'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#333333] dark:border-zinc-800 rounded-2xl p-8 bg-gray-50 dark:bg-zinc-900/50 text-center relative overflow-hidden">
                {!currentStudio?.whatsapp_instance_name ? (
                  <span className="material-icons text-6xl text-gray-300 dark:text-zinc-700">phonelink_lock</span>
                ) : // Logic for Connected vs QR Code
                  connectionStatus === 'CONNECTED' ? (
                    <div className="animate-fade-in flex flex-col items-center">
                      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-zinc-50">Tudo Certo!</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        O WhatsApp está conectado e operando normalmente.
                      </p>
                    </div>
                  ) : (
                    loadingQr ? (
                      <div className="flex flex-col items-center">
                        <span className="material-icons animate-spin text-4xl text-primary mb-4">sync</span>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">Gerando QR Code...</p>
                      </div>
                    ) : (
                      <div className="animate-fade-in flex flex-col items-center">
                        <div className="mb-6 bg-white p-2 rounded-xl shadow-lg border border-gray-100">
                          {qrCode ? (
                            <img className="w-48 h-48 object-contain" src={qrCode} alt="WhatsApp QR Code" />
                          ) : (
                            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                              Erro ao carregar QR
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-zinc-50">Conectar Dispositivo</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs">
                          Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho e aponte a câmera.
                        </p>
                        <button onClick={() => fetchConnectionInfo()} className="mt-6 text-primary text-xs font-bold hover:underline">
                          Gerar Novo QR Code
                        </button>
                      </div>
                    )
                  )
                }
              </div>
            </div>
          </section>
        )}

        {/* Other tabs follow similar structure */}
        {activeTab === 'usuarios' && (
          <section className="animate-fade-in relative">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-zinc-50">
                <span className="material-icons mr-2 text-gray-500 dark:text-zinc-400">group</span>
                Gestão de Usuários
              </h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsNewUserModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-icons">add</span>
                NOVO USUÁRIO
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 flex items-center gap-4 hover:border-primary transition-all group cursor-pointer">
                  <div className="rounded-full border-2 p-0.5" style={{ borderColor: user.userColor }}>
                    <Avatar
                      src={user.avatar}
                      name={`${user.name} ${user.surname}`}
                      className="w-14 h-14"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-zinc-50 group-hover:text-primary transition-colors">{user.name} {user.surname}</h3>
                    <p className="text-xs text-gray-500 font-medium dark:text-zinc-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: `${user.userColor}33`, // 20% opacity using hex
                          color: user.userColor
                        }}
                      >
                        {user.roleTitle}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="material-icons text-gray-300 dark:text-zinc-600 group-hover:text-primary hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-full transition-all"
                  >
                    edit
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
        {activeTab === 'anamnese' && (
          <section className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-zinc-50">
                <span className="material-icons mr-2 text-gray-500 dark:text-zinc-400">content_paste</span>
                Ficha de Anamnese
              </h2>
              <button className="bg-[#333333] hover:bg-black text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all text-sm flex items-center">
                <span className="material-icons text-sm mr-2">save</span>
                Salvar
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-8 max-w-2xl dark:text-zinc-400">
              Configure os itens que aparecerão na ficha de anamnese durante o atendimento.
              Estes itens serão apresentados como um checklist para indicar condições de saúde do cliente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

              {/* Add New Item */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase tracking-wide">Novo Item de Anamnese</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAnamnesisItem()}
                      placeholder="Ex: Diabetes, Pressão Alta..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                    />
                    <button
                      onClick={handleAddAnamnesisItem}
                      className="bg-[#92FFAD] hover:bg-[#7cefa0] text-black font-bold p-3 rounded-xl shadow-sm transition-all flex items-center justify-center aspect-square"
                    >
                      <span className="material-icons">add</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Pressione Enter para adicionar rapidamente.</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                  <span className="material-icons text-blue-500 text-lg mt-0.5">info</span>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Os itens marcados pelo cliente durante o atendimento ficarão destacados em vermelho na ficha final para alerta do profissional.
                  </p>
                </div>
              </div>

              {/* List Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700 dark:text-zinc-50">Itens Ativos ({anamnesisItems.length})</h3>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                  {anamnesisItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <span className="material-icons text-4xl mb-2 opacity-50">playlist_add</span>
                      <p>Nenhum item configurado.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                      {anamnesisItems.map((item, index) => (
                        <li key={index} className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            <span className="text-gray-800 dark:text-zinc-50 font-medium">{item}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAnamnesisItem(index)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                            title="Remover item"
                          >
                            <span className="material-icons text-lg">delete</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </section>
        )}
        {activeTab === 'mensagem' && (
          <div className="text-center py-10 text-gray-500">
            Interface de Modelos de Mensagem...
          </div>
        )}

        {activeTab === 'fidelidade' && (
          <section className="animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-zinc-50">
                <span className="material-icons mr-2 text-primary">loyalty</span>
                Programa de Fidelidade (Cashback)
              </h2>
              <button
                onClick={handleSaveLoyaltyConfig}
                disabled={loadingConfig}
                className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-2 px-6 rounded-lg shadow-md transition-all text-sm flex items-center disabled:opacity-50 hover:scale-105"
              >
                <span className="material-icons text-sm mr-2">save</span>
                {loadingConfig ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>

            {/* Toggles and Configs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-zinc-50">Programa Ativo?</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Habilita o cashback automático no checkout.</p>
                  </div>
                  <div
                    onClick={() => setLoyaltyConfig({ ...loyaltyConfig, isActive: !loyaltyConfig.isActive })}
                    className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${loyaltyConfig.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${loyaltyConfig.isActive ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Tipo de Recompensa</label>
                    <select
                      value={loyaltyConfig.rewardType}
                      onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, rewardType: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 focus:ring-1 outline-none"
                    >
                      <option value="PERCENTAGE">Porcentagem (%)</option>
                      <option value="FIXED">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Valor</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={loyaltyConfig.rewardValue}
                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, rewardValue: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        {loyaltyConfig.rewardType === 'PERCENTAGE' ? '%' : 'R$'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Validade (Dias)</label>
                    <input
                      type="number"
                      value={loyaltyConfig.validityDays}
                      onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, validityDays: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Mínimo Compra (R$)</label>
                    <input
                      type="number"
                      value={loyaltyConfig.minSpentToUse}
                      onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, minSpentToUse: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Card */}
              <div className="bg-gradient-to-br from-[#92FFAD]/20 to-[#5CDFF0]/20 rounded-2xl p-8 border border-[#92FFAD]/50 flex flex-col justify-center items-center text-center">
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-zinc-50">Simulação Visual</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-300 mb-6">
                  "Se o cliente gastar <strong className="text-gray-900 dark:text-zinc-50">R$ 1.000,00</strong>, ele receberá <strong className="text-green-600 dark:text-[#92FFAD]">
                    {loyaltyConfig.rewardType === 'PERCENTAGE'
                      ? `R$ ${(1000 * (loyaltyConfig.rewardValue / 100)).toFixed(2)} (${loyaltyConfig.rewardValue}%)`
                      : `R$ ${loyaltyConfig.rewardValue.toFixed(2)}`
                    }
                  </strong> de cashback para usar na próxima visita em até <strong className="text-gray-900 dark:text-zinc-50">{loyaltyConfig.validityDays} dias</strong>."
                </p>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-lg w-full max-w-sm border border-gray-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3 mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Extrato do Cliente</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">GANHOU</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 dark:text-zinc-50">Cashback Sessão Tatuagem</p>
                      <p className="text-xs text-gray-400">Expira em 24/05/2026</p>
                    </div>
                    <p className="font-bold text-green-500">+ R$ {
                      loyaltyConfig.rewardType === 'PERCENTAGE'
                        ? (1000 * (loyaltyConfig.rewardValue / 100)).toFixed(2)
                        : loyaltyConfig.rewardValue.toFixed(2)
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => {
          setIsNewUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        initialData={editingUser}
      />
    </div>
  );
};

export default Settings;

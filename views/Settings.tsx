import React, { useState, useEffect } from 'react';
import InviteUserModal from '../components/NewUserModal';
import Avatar from '../components/Avatar';
import { teamService } from '../services/teamService';
import { loyaltyService } from '../services/loyaltyService';
import { whatsappService } from '../services/whatsappService';
import { studioService } from '../services/studioService';
import WhatsAppConnectModal from '../components/WhatsAppConnectModal';
// ... existing imports ...
import { supabase } from '../lib/supabase'; // Imported supabase
import { LoyaltyConfig } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { session, currentStudio } = useAuth(); // Assuming currentStudio availability
  const [activeTab, setActiveTab] = useState('dados');

  // Studio Data State
  const [studioData, setStudioData] = useState({
    name: '',
    slug: '',
    cnpj: '',
    zip_code: '',
    address_street: '',
    address_number: '',
    city: '',
    state: '',
    contact_phone: '',
    contact_email: ''
  });

  // Slug State
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Sync state with currentStudio when it loads
  // Sync state with real studio data from DB
  useEffect(() => {
    const fetchStudioDetails = async () => {
      if (currentStudio?.id) {
        const data = await studioService.getStudioSettings(currentStudio.id);
        if (data) {
          setStudioData({
            name: data.name || '',
            slug: data.slug || '',
            cnpj: data.cnpj || '',
            zip_code: data.zip_code || '',
            address_street: data.address_street || '',
            address_number: data.address_number || '',
            city: data.city || '',
            state: data.state || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || ''
          });
          setIsSlugManual(!!data.slug);
        }
      }
    };

    fetchStudioDetails();
  }, [currentStudio?.id]);


  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // Split accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .trim()
      .replace(/\s+/g, '-') // Spaces to hyphens
      .replace(/[^\w\-]+/g, '') // Remove non-word chars
      .replace(/\-\-+/g, '-'); // Merge multiple hyphens
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setStudioData(prev => ({ ...prev, name: newName }));

    if (!isSlugManual) {
      const newSlug = generateSlug(newName);
      setStudioData(prev => ({ ...prev, slug: newSlug }));
      // Debounce check would go here, but we'll check on blur or effect
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudioData(prev => ({ ...prev, slug: e.target.value }));
    setIsSlugManual(true);
    setSlugError('');
  };

  const checkSlug = async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) return;

    setIsCheckingSlug(true);
    const isAvailable = await studioService.checkSlugAvailability(slugToCheck, currentStudio?.id);
    setIsCheckingSlug(false);

    if (!isAvailable) {
      // If taken, suggest logic or just error
      // Requirement: "OU adicione automaticamente um sufixo numérico"
      // Let's implement auto-suffix suggestion if autosaving, but here for UI feedback let's show error first
      setSlugError('Este endereço de link já está em uso.');
      // Optionally suggest:
      suggestAlternative(slugToCheck);
    } else {
      setSlugError('');
    }
  };

  const suggestAlternative = async (baseSlug: string) => {
    let counter = 1;
    let available = false;
    let candidate = '';
    while (!available && counter < 5) { // Limit attempts
      candidate = `${baseSlug}-${counter}`;
      available = await studioService.checkSlugAvailability(candidate, currentStudio?.id);
      if (available) {
        setSlugError(`Link indisponível. Sugestão: ${candidate}`);
        // Optionally we could just setSlug(candidate) if we want to be aggressive
        return;
      }
      counter++;
    }
  };

  // Check slug when it changes (debounced effect ideally, but onBlur is safer for now effectively)
  // Let's use useEffect with timeout for debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studioData.slug) {
        checkSlug(studioData.slug);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [studioData.slug]);

  // WhatsApp State
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [waCredentials, setWaCredentials] = useState<{ instanceId?: string, token?: string, instanceName?: string, manualInstanceName?: string }>({});
  const [debugData, setDebugData] = useState<any>(null); // New Debug State

  // Anamnesis State (Restored)
  const [newItem, setNewItem] = useState('');

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

  // In fetchConnectionInfo update:
  const fetchConnectionInfo = async (instanceId?: string, token?: string) => {
    const id = instanceId || waCredentials.instanceId || currentStudio?.whatsapp_instance_id;
    const tok = token || waCredentials.token || currentStudio?.whatsapp_token;

    if (!id || !tok) {
      console.warn('Missing WhatsApp credentials:', { id, tok, studio: currentStudio });
      setDebugData({ error: 'Missing credentials. Try reloading or provision again.' });
      return;
    }

    setLoadingQr(true);
    // Use the REAL connectInstance which requires ID and Token
    const info = await whatsappService.connectInstance(tok);

    setConnectionStatus(info.status);
    setQrCode(info.qrCode || null); // Fix type safety
    setDebugData(info.debug); // Store Debug Data
    setLoadingQr(false);
  };

  const handleSendTest = async () => {
    const { instanceId, token } = waCredentials;
    if (!instanceId || !token) return;

    setLoadingQr(true);
    // Use REAL sendMessage
    const res = await whatsappService.sendMessage(
      instanceId,
      token,
      '5511999999999',
      'Olá! O Safetatt conectou com sucesso no servidor UazAPI.'
    );
    if (res.success) {
      alert('Mensagem de teste enviada!');
    } else {
      alert('Erro ao enviar mensagem: ' + (res.error?.message || 'Erro desconhecido'));
    }
    setLoadingQr(false);
  };

  const handleDisconnect = async () => {
    const { instanceId, token, instanceName } = waCredentials;
    const nameToUse = instanceName || currentStudio?.whatsapp_instance_name;
    const tokenToUse = token || currentStudio?.whatsapp_token;

    if (!nameToUse || !tokenToUse) return;

    if (!confirm('Tem certeza que deseja desconectar? Você precisará ler o QR Code novamente.')) return;

    setLoadingQr(true);
    await whatsappService.logoutInstance(nameToUse, tokenToUse);
    setConnectionStatus('DISCONNECTED');
    setQrCode(null);
    setLoadingQr(false);
    alert('Desconectado com sucesso!');
    // Trigger reconnection to get new QR
    fetchConnectionInfo(instanceId, tokenToUse);
  };

  // User List State (Real Data)
  const [users, setUsers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Edit User State
  // Edit User State
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  // Expanded form state
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cpf: '',
    role: '',
    color: '#92FFAD'
  });

  useEffect(() => {
    if (activeTab === 'usuarios') {
      loadTeamMembers();
    }
  }, [activeTab]);

  const loadTeamMembers = async () => {
    if (!currentStudio?.id) return;
    console.log('🔒 Loading members for studio:', currentStudio.id);
    const members = await teamService.getTeamMembers(currentStudio.id);
    console.log('✅ Members loaded:', members.length);
    setUsers(members);
  };




  // ... (inside component)
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);
  const [anamnesisItems, setAnamnesisItems] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'anamnese' && currentStudio?.id) {
      loadAnamnesisSettings();
    }
  }, [activeTab, currentStudio]);

  const loadAnamnesisSettings = async () => {
    if (!currentStudio?.id) return;
    const settings = await studioService.getStudioSettings(currentStudio.id);
    if (settings?.settings_anamnesis) {
      // Ensure it's an array of strings
      const items = Array.isArray(settings.settings_anamnesis) ? settings.settings_anamnesis : [];
      setAnamnesisItems(items);
    } else {
      // Fallback or empty if not set
      setAnamnesisItems([
        'Diabetes', 'Hipertensão', 'Alergias', 'Uso de Anticoagulantes',
        'Gravidez', 'Lactante', 'Hepatite', 'HIV/AIDS',
        'Problemas de Pele', 'Cirurgias Recentes', 'Quelóide'
      ]);
    }
  };


  const handleEditClick = (user: any) => {
    setEditingMember(user);

    const names = (user.full_name || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    setEditFormData({
      firstName,
      lastName,
      email: user.email || '',
      phone: user.phone || '',
      cpf: user.cpf || '',
      role: user.role || 'ARTIST',
      color: user.color || '#92FFAD'
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;
    setSavingMember(true);

    const fullName = `${editFormData.firstName} ${editFormData.lastName}`.trim();

    const res = await teamService.updateMember(editingMember.id, editingMember.profile_id, {
      role: editFormData.role,
      full_name: fullName,
      email: editFormData.email,
      phone: editFormData.phone,
      cpf: editFormData.cpf,
      color: editFormData.color
    });

    setSavingMember(false);
    if (res.success) {
      alert('Usuário atualizado!');
      setIsEditUserModalOpen(false);
      loadTeamMembers();
    } else {
      alert('Erro ao atualizar usuário.');
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      const res = await teamService.removeMember(id);
      if (res.success) {
        alert('Usuário removido!');
        loadTeamMembers();
      } else {
        alert('Erro ao remover usuário.');
      }
    }
  };
  const [savingData, setSavingData] = useState(false);

  const handleSaveStudioData = async () => {
    if (!currentStudio?.id) return;
    if (slugError) {
      alert('Por favor, corrija o link do estúdio antes de salvar.');
      return;
    }

    setSavingData(true);
    const res = await studioService.updateStudioSettings(currentStudio.id, {
      ...studioData
    });

    setSavingData(false);

    if (res.success) {
      alert('Dados do estúdio atualizados com sucesso!');
    } else {
      alert('Erro ao atualizar dados. Verifique se o link já não está em uso.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudioData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAnamnesis = async () => {
    if (!currentStudio?.id) return;
    setLoadingAnamnesis(true);
    const res = await studioService.updateStudioSettings(currentStudio.id, {
      settings_anamnesis: anamnesisItems
    });

    if (res.success) {
      alert('Ficha de Anamnese atualizada com sucesso!');
    } else {
      alert('Erro ao salvar anamnese.');
    }
    setLoadingAnamnesis(false);
  };

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

  // Loyalty State
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
    isActive: false,
    rewardType: 'PERCENTAGE', // Uppercase default
    rewardValue: 10,
    minSpentToUse: 100,
    validityDays: 90,
    maxUsageLimit: 100
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Fetch Loyalty Config on Load
  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      if (activeTab === 'fidelidade' && currentStudio?.id) {
        setLoadingConfig(true);
        const data = await loyaltyService.getSettings(currentStudio.id);
        if (data) {
          setLoyaltyConfig(prev => ({
            ...prev,
            isActive: data.isActive,
            rewardType: data.rewardType,
            rewardValue: data.rewardValue,
            validityDays: data.validityDays,
            minSpentToUse: data.minSpentToUse
          }));
        }
        setLoadingConfig(false);
      }
    };

    fetchLoyaltySettings();
  }, [activeTab, currentStudio?.id]);

  const handleSaveLoyaltyConfig = async () => {
    if (!currentStudio?.id) return;
    setLoadingConfig(true);

    const { success, error } = await loyaltyService.upsertSettings(currentStudio.id, loyaltyConfig);

    setLoadingConfig(false);

    if (success) {
      alert('Configurações salvas com sucesso!');
      window.dispatchEvent(new Event('refreshGlobalData'));
    } else {
      console.error('Save error:', error);
      alert(`Erro ao salvar configurações: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados do estúdio', icon: 'store' },
    { id: 'usuarios', label: 'Usuários', icon: 'people' },
    { id: 'anamnese', label: 'Anamnese', icon: 'content_paste' },
    { id: 'whatsapp', label: 'Whatsapp', icon: 'chat' },
    { id: 'mensagem', label: 'Mensagem', icon: 'email' },
    { id: 'fidelidade', label: 'Cashback', icon: 'loyalty' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6">
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

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-[#333333] dark:border-zinc-800 p-5 md:p-8 space-y-12">
        {activeTab === 'dados' && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-zinc-50">
              <span className="material-icons mr-2 text-gray-500 dark:text-zinc-400">store</span>
              Dados do Estúdio
            </h2>
            <div className="space-y-8">
              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-2 flex flex-col items-center md:items-start">
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block">Logo do Estúdio</label>
                  <label className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl p-2 flex flex-col items-center justify-center w-32 h-32 md:w-full md:aspect-square group cursor-pointer hover:border-primary transition-colors relative overflow-hidden">
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
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                        type="text"
                        value={studioData.name}
                        onChange={handleNameChange} // Use our handler
                        placeholder="Nome do Estúdio"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">CNPJ</label>
                      <input
                        name="cnpj"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                        type="text"
                        value={studioData.cnpj}
                        onChange={handleInputChange}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Link Cadastro Cliente</label>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-zinc-400 overflow-hidden">
                          <span className="text-gray-500 mr-1 whitespace-nowrap">{window.location.origin}/cadastro/</span>
                          <input
                            type="text"
                            value={studioData.slug}
                            onChange={handleSlugChange}
                            className="bg-transparent border-none outline-none text-gray-900 dark:text-zinc-50 font-bold placeholder-gray-400 w-full"
                            placeholder="seu-link-aqui"
                          />
                        </div>
                        {slugError && <p className="text-xs text-red-500 font-bold mt-1 ml-1">{slugError}</p>}
                        {isCheckingSlug && <p className="text-xs text-blue-500 font-bold mt-1 ml-1">Verificando disponibilidade...</p>}
                      </div>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/cadastro/${currentStudio?.slug}`;
                          navigator.clipboard.writeText(url);
                          alert('Link copiado!');
                        }}
                        className="bg-[#333333] hover:bg-black text-white px-4 rounded-xl shadow-md transition-all flex items-center justify-center font-bold"
                        title="Copiar Link"
                      >
                        <span className="material-icons text-sm">content_copy</span>
                      </button>
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
                    <input
                      name="zip_code"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="text"
                      value={studioData.zip_code}
                      onChange={handleInputChange}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Endereço</label>
                    <input
                      name="address_street"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="text"
                      value={studioData.address_street}
                      onChange={handleInputChange}
                      placeholder="Rua..."
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Número / Comp.</label>
                    <input
                      name="address_number"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="text"
                      value={studioData.address_number}
                      onChange={handleInputChange}
                      placeholder="Número"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Cidade</label>
                    <input
                      name="city"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="text"
                      value={studioData.city}
                      onChange={handleInputChange}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">Estado</label>
                    <input
                      name="state"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="text"
                      value={studioData.state}
                      onChange={handleInputChange}
                      placeholder="Estado"
                    />
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
                    <input
                      name="contact_phone"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="text"
                      value={studioData.contact_phone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block tracking-wide">E-mail de Contato</label>
                    <input
                      name="contact_email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-gray-900 dark:text-zinc-50 focus:border-[#333333] focus:ring-1 focus:ring-[#333333] outline-none transition-all"
                      type="email"
                      value={studioData.contact_email}
                      onChange={handleInputChange}
                      placeholder="email@estudio.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSaveStudioData}
                  disabled={savingData || !!slugError}
                  className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-10 rounded-xl shadow-lg transition-all flex items-center transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons mr-2">{savingData ? 'sync' : 'save'}</span>
                  {savingData ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'whatsapp' && (
          <section className="animate-fade-in">
            <h2 className="text-lg md:text-xl font-bold flex items-center flex-wrap gap-2 text-gray-900 dark:text-zinc-50 mb-6">
              <span className="material-icons text-green-500 shrink-0">whatsapp</span>
              <span>Configuração do WhatsApp</span>
            </h2>
            <div className="space-y-8 w-full">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 w-full">
                <div className="flex flex-col gap-8 w-full">

                  {/* GLOBAL DEBUG DISPLAY */}
                  <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-xl font-mono text-xs overflow-hidden">
                    <p className="font-bold text-gray-700 mb-2">🔧 Debug Info (Envie um print disso):</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>Status: <span className="font-bold">{connectionStatus}</span></div>
                      <div>QR Length: {qrCode ? qrCode.length : '0'}</div>
                      <div className="col-span-2">Instance: {currentStudio?.whatsapp_instance_name || waCredentials.instanceName || 'N/A'}</div>
                    </div>
                    {debugData && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="font-bold text-gray-600 mb-1">Raw Response:</p>
                        <pre className="overflow-x-auto max-h-32 bg-white p-2 rounded border border-gray-200 text-[10px] whitespace-pre-wrap">
                          {JSON.stringify(debugData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Show Activation Card only if NO instance in Studio AND NO local instance */}
                  {(!currentStudio?.whatsapp_instance_name && !waCredentials.instanceName) ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 md:p-8 text-center">
                      {/* ... icon/text ... */}
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-3xl text-blue-600 dark:text-blue-400">rocket_launch</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-50 mb-2">Ativar Integração WhatsApp</h3>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                        Automatize o envio de lembretes e fidelize seus clientes. Clique abaixo para ativar.
                      </p>

                      <div className="mb-4 max-w-xs mx-auto text-left">
                        <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 mb-1 block">Nome da Instância (Opcional)</label>
                        <input
                          type="text"
                          placeholder={currentStudio?.name ? `Ex: ${generateSlug(currentStudio.name).replace(/-/g, '_')}` : 'nome_instancia'}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                          onChange={(e) => setWaCredentials(prev => ({ ...prev, manualInstanceName: e.target.value }))}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Deixe em branco para gerar automaticamente.</p>
                      </div>

                      <button
                        onClick={async () => {
                          if (!currentStudio?.id || !currentStudio?.name) return;
                          // ... logic updated below ...
                          const targetName = waCredentials.manualInstanceName || currentStudio.name;

                          if (!confirm(`Deseja conectar à instância "${targetName}"?`)) return;

                          setLoadingQr(true);
                          try {
                            // 1. Provision (Updated to handle raw names if manual)
                            const res = await whatsappService.provisionInstance(targetName, currentStudio.id);

                            if (res.success && res.instanceName) {
                              // 2. Refresh Token from DB
                              const { data: freshStudio } = await supabase
                                .from('studios')
                                .select('*')
                                .eq('id', currentStudio.id)
                                .single();

                              if (freshStudio?.whatsapp_token) {
                                // UPDATE LOCAL STATE so UI updates immediately without reload
                                setWaCredentials({
                                  instanceId: freshStudio.whatsapp_instance_id,
                                  token: freshStudio.whatsapp_token,
                                  instanceName: res.instanceName
                                });

                                // 3. Connect for QR
                                const connectRes = await whatsappService.connectInstance(freshStudio.whatsapp_token);

                                setDebugData({
                                  ...connectRes.debug,
                                  _client_check: {
                                    token_prefix: freshStudio.whatsapp_token?.substring(0, 5),
                                    has_global_key: !!import.meta.env.VITE_WHATSAPP_GLOBAL_KEY
                                  }
                                }); // Show Debug Info Immediately

                                if (connectRes.qrCode) {
                                  setQrCode(connectRes.qrCode);
                                  setConnectionStatus('DISCONNECTED');
                                } else if (connectRes.status === 'CONNECTED') {
                                  setConnectionStatus('CONNECTED');
                                }

                                alert('Instância criada! Escaneie o QR Code ao lado.');
                                // REMOVED: window.location.reload(); 
                              }
                            } else {
                              const errorMsg = res.error?.response?.data?.message || res.error?.message || JSON.stringify(res.error);
                              alert(`Erro ao criar instância: ${errorMsg}`);
                            }
                          } catch (err: any) {
                            console.error('Erro detalhado:', err);
                            alert(`Erro: ${err.message || 'Desconhecido'}`);
                          } finally {
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
                          value={currentStudio?.whatsapp_instance_name || waCredentials.instanceName || ''}
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
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={handleSendTest}
                            disabled={loadingQr}
                            className="w-full bg-[#333333] hover:bg-black text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-icons text-sm">send</span>
                            {loadingQr ? 'Enviando...' : 'Enviar Mensagem de Teste'}
                          </button>

                          <button
                            onClick={handleDisconnect}
                            disabled={loadingQr}
                            className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 px-6 rounded-xl border border-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-icons text-sm">logout</span>
                            Desconectar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#333333] dark:border-zinc-800 rounded-2xl p-8 bg-gray-50 dark:bg-zinc-900/50 text-center relative overflow-hidden h-[400px]">
                  {(!currentStudio?.whatsapp_instance_name && !waCredentials.instanceName) ? (
                    <div className="flex flex-col items-center">
                      <span className="material-icons text-6xl text-gray-300 dark:text-zinc-700 mb-4">phonelink_lock</span>
                      <p className="text-gray-400">Instância não configurada.</p>
                    </div>
                  ) : // Logic for Connected vs QR Code
                    connectionStatus === 'CONNECTED' ? (
                      <div className="animate-fade-in flex flex-col items-center">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                          <span className="material-icons text-5xl text-green-500">check_circle</span>
                        </div>
                        <h3 className="font-bold text-2xl mb-2 text-gray-900 dark:text-zinc-50">Tudo Certo!</h3>
                        <p className="text-gray-500 dark:text-zinc-400 mb-8 max-w-sm">
                          O WhatsApp está conectado e pronto para enviar mensagens automáticas.
                        </p>

                        <button
                          onClick={handleDisconnect}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-8 rounded-xl border border-red-200 transition-all flex items-center gap-3"
                        >
                          <span className="material-icons">logout</span>
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <div className="animate-fade-in flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                          <span className="material-icons text-4xl text-gray-400">qr_code_2</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-zinc-50">WhatsApp Desconectado</h3>
                        <p className="text-gray-500 dark:text-zinc-400 mb-8 max-w-xs leading-relaxed">
                          Conecte seu WhatsApp para habilitar as automações do sistema.
                        </p>

                        <button
                          onClick={() => setIsConnectModalOpen(true)}
                          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold py-4 px-10 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-3 text-lg"
                        >
                          <span className="material-icons">link</span>
                          Conectar WhatsApp
                        </button>

                        <WhatsAppConnectModal
                          isOpen={isConnectModalOpen}
                          onClose={() => setIsConnectModalOpen(false)}
                          token={waCredentials.token || currentStudio?.whatsapp_token || ''}
                          onSuccess={() => {
                            fetchConnectionInfo(); // Using correct refresh function
                            setIsConnectModalOpen(false);
                          }}
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
          </section>
        )
        }

        {/* Other tabs follow similar structure */}
        {
          activeTab === 'usuarios' && (
            <section className="animate-fade-in relative">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-zinc-50">
                  <span className="material-icons mr-2 text-gray-500 dark:text-zinc-400">group</span>
                  Gestão de Usuários
                </h2>
                <button
                  onClick={() => {
                    setIsInviteModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-sm"
                >
                  <span className="material-icons">send</span>
                  Novo Usuário
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 flex items-center gap-4 hover:border-primary transition-all group cursor-pointer">
                    <div className="rounded-full border-2 p-0.5 border-[#333333]" style={{ borderColor: '#333333' }}>
                      <Avatar
                        src={user.avatar_url}
                        name={user.full_name}
                        className="w-14 h-14"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-zinc-50 group-hover:text-primary transition-colors">{user.full_name}</h3>
                      <p className="text-xs text-gray-500 font-medium dark:text-zinc-400">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 text-[#333333]"
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="material-icons text-gray-300 dark:text-zinc-600 hover:text-primary hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-full transition-all"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => handleRemoveMember(user.id)}
                        className="material-icons text-gray-300 dark:text-zinc-600 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-full transition-all"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        }
        {
          activeTab === 'anamnese' && (
            <section className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-zinc-50">
                  <span className="material-icons mr-2 text-gray-500 dark:text-zinc-400">content_paste</span>
                  Ficha de Anamnese
                </h2>
                <button
                  onClick={handleSaveAnamnesis}
                  disabled={loadingAnamnesis}
                  className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-2 px-6 rounded-lg shadow-md transition-all text-sm flex items-center disabled:opacity-50 hover:brightness-110"
                >
                  <span className="material-icons text-sm mr-2">{loadingAnamnesis ? 'sync' : 'save'}</span>
                  {loadingAnamnesis ? 'Salvando...' : 'Salvar'}
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
          )
        }
        {
          activeTab === 'mensagem' && (
            <div className="text-center py-10 text-gray-500">
              Interface de Modelos de Mensagem...
            </div>
          )
        }

        {
          activeTab === 'fidelidade' && (
            <section className="animate-fade-in">
              {/* Header */}
              <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-zinc-50 mb-8">
                <span className="material-icons mr-2 text-primary">loyalty</span>
                Cashback
              </h2>

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

              {/* Save Button */}
              <div className="flex justify-end pt-8">
                <button
                  onClick={handleSaveLoyaltyConfig}
                  disabled={loadingConfig}
                  className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-10 rounded-xl shadow-lg transition-all flex items-center transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons mr-2">{loadingConfig ? 'sync' : 'save'}</span>
                  {loadingConfig ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </section>
          )
        }
      </div >
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => loadTeamMembers()}
      />
      { /* Edit User Modal */}
      {
        isEditUserModalOpen && editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in py-10 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-2xl border border-[#333333] shadow-2xl relative my-auto">
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <span className="material-icons">close</span>
              </button>

              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-zinc-50">Editar Usuário</h2>

              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 cursor-pointer hover:border-primary transition-colors">
                  <span className="material-icons text-gray-400 text-3xl">add_a_photo</span>
                </div>
                <p className="text-sm font-bold text-gray-500">Adicionar Foto</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Nome *</label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Sobrenome *</label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">E-mail *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Telefone/WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">CPF</label>
                  <input
                    type="text"
                    value={editFormData.cpf}
                    onChange={e => setEditFormData({ ...editFormData, cpf: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Função</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#333333] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ARTIST">Tatuador</option>
                    <option value="MASTER">Master</option>
                    <option value="RECEPTIONIST">Recepcionista</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 block uppercase">Cor de Exibição</label>
                  <div className="flex bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 rounded-xl px-4 py-3 items-center">
                    <input
                      type="color"
                      value={editFormData.color}
                      onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                      className="w-8 h-8 rounded border-none p-0 bg-transparent cursor-pointer mr-2"
                    />
                    <span className="text-gray-500 dark:text-zinc-400 uppercase text-sm font-bold">{editFormData.color}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="flex-1 py-3 px-6 rounded-xl border border-gray-200 dark:border-zinc-800 font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all dark:text-zinc-50 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMember}
                  disabled={savingMember}
                  className="flex-1 bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center"
                >
                  {savingMember ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Settings;

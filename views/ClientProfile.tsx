import React, { useState, useEffect } from 'react';
import { Client, LoyaltyTransaction } from '../types';
import { loyaltyService } from '../services/loyaltyService';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import Avatar from '../components/Avatar';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';
import ErrorBoundary from '../components/ErrorBoundary'; // Import ErrorBoundary

interface ClientProfileProps {
  clientId: string;
  initialTab?: string;
  onBack: () => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ clientId, initialTab = 'dados', onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  // Mobile drill-down navigation state: 'menu' shows profile + menu, 'content' shows section content
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle tab selection - on mobile, switch to content view
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setMobileView('content');
  };

  // Handle mobile back button - return to menu view
  const handleMobileBack = () => {
    setMobileView('menu');
  };

  // Client Data State
  const [client, setClient] = useState<Client | null>(null);
  const [isLimit, setIsLimit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Client>({} as Client);
  const [isLoadingClient, setIsLoadingClient] = useState(true);

  // Fetch Client Data
  const fetchClient = async () => {
    if (!clientId) return;
    setIsLoadingClient(true);
    const data = await clientService.getClientById(clientId);
    if (data) {
      setClient(data);
      setFormData(data);
    }
    setIsLoadingClient(false);
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  // Global Refresh Listener
  useEffect(() => {
    const handleRefresh = () => fetchClient();
    window.addEventListener('refreshGlobalData', handleRefresh);
    return () => window.removeEventListener('refreshGlobalData', handleRefresh);
  }, [clientId]);


  // Loyalty State
  const { currentStudio } = useAuth();
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');
  const [processingBalance, setProcessingBalance] = useState(false);

  const handleManualBalance = async () => {
    if (!currentStudio?.id || !clientId || !balanceAmount) return;

    setProcessingBalance(true);
    try {
      const amount = parseFloat(balanceAmount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        alert('Valor inválido');
        setProcessingBalance(false);
        return;
      }

      await loyaltyService.createTransaction({
        studio_id: currentStudio.id,
        client_id: clientId,
        type: 'MANUAL_ADJUST',
        amount: amount,
        description: balanceDescription || 'Ajuste manual de saldo',
        expires_at: null
      });

      // Refresh data
      const balanceData = await loyaltyService.getClientBalance(clientId);
      // @ts-ignore
      setLoyaltyBalance(balanceData);
      const history = await loyaltyService.getClientHistory(clientId);
      setLoyaltyHistory(history || []);

      setShowBalanceModal(false);
      setBalanceAmount('');
      setBalanceDescription('');
      alert('Saldo adicionado com sucesso!');

    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar saldo');
    } finally {
      setProcessingBalance(false);
    }
  };

  const [loyaltyBalance, setLoyaltyBalance] = useState({ balance: 0, nextExpiration: null as string | null });
  const [loyaltyHistory, setLoyaltyHistory] = useState<any[]>([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  useEffect(() => {
    if (activeTab === 'fidelidade' && clientId) {
      const fetchLoyalty = async () => {
        setLoadingLoyalty(true);
        const balanceData = await loyaltyService.getClientBalance(clientId);
        // @ts-ignore
        setLoyaltyBalance(balanceData);

        const history = await loyaltyService.getClientHistory(clientId);
        setLoyaltyHistory(history || []);
        setLoadingLoyalty(false);
      };
      fetchLoyalty();
    }
  }, [activeTab, clientId]);

  // Appointments State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5;
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Financial State
  const [financialSummary, setFinancialSummary] = useState({ total: 0, count: 0, average: 0 });

  // Notes State
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch Appointments & Stats
  // Fetch Appointments (Paginated)
  useEffect(() => {
    if (activeTab === 'atendimentos' && clientId) {
      const fetchAppointments = async () => {
        setIsLoadingAppointments(true);
        try {
          const { data, count } = await sessionService.getSessionsByClient(
            clientId,
            currentPage,
            appointmentsPerPage // 5
          );
          setAppointments(data);
          setTotalAppointments(count);
        } catch (error) {
          console.error("Error fetching client sessions", error);
        } finally {
          setIsLoadingAppointments(false);
        }
      };
      fetchAppointments();
    }
  }, [activeTab, clientId, currentPage]);

  // Fetch Financial Stats (Separate Tab)
  useEffect(() => {
    if (activeTab === 'financeiro' && clientId) {
      const fetchFinancials = async () => {
        try {
          const metrics = await sessionService.getClientMetrics(clientId);
          setFinancialSummary(metrics);
        } catch (error) {
          console.error("Error fetching financial metrics", error);
        }
      };
      fetchFinancials();
    }
  }, [activeTab, clientId]);

  // Fetch Notes
  useEffect(() => {
    if (activeTab === 'observacoes' && clientId) {
      const fetchNotes = async () => {
        setIsLoadingNotes(true);
        const data = await clientService.getNotes(clientId);
        setNotes(data || []);
        setIsLoadingNotes(false);
      };
      fetchNotes();
    }
  }, [activeTab, clientId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser()); // Dynamic import or useAuth
    // Actually we have useAuth

    // We need author name. Ideally from session or profile.
    // For now hardcode or use session.user.email?
    // Step 881 showed useAuth in ClientProfile import.

    const note = await clientService.addNote({
      clientId,
      content: newNote,
      type: 'info',
      authorName: 'Profissional' // Improve this if possible
    });

    if (note) {
      setNotes(prev => [note, ...prev]);
      setNewNote('');
    }
    setIsSubmittingNote(false);
  };

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (noteId: string) => {
    const res = await clientService.updateNote(noteId, editContent);
    if (res.success) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editContent } : n));
      setEditingNoteId(null);
      setEditContent('');
    } else {
      alert('Erro ao atualizar nota.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta observação?')) {
      const res = await clientService.deleteNote(noteId);
      if (res.success) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        alert('Erro ao excluir nota.');
      }
    }
  };

  const handleUpdateClient = async () => {
    const res = await clientService.updateClient(clientId, formData);
    if (res.success) {
      setClient(formData);
      setIsEditing(false);
      alert('Cliente atualizado com sucesso!');
    } else {
      alert('Erro ao atualizar cliente.');
    }
  };

  // ... (Keep render parts)

  // ... inside return ...




  const tabs = [
    { id: 'dados', label: 'Dados do Cliente', icon: 'person' },
    { id: 'atendimentos', label: 'Lista de Atendimentos', icon: 'event' },
    { id: 'financeiro', label: 'Financeiro', icon: 'payments' },
    { id: 'fidelidade', label: 'Cashback', icon: 'loyalty' },
    { id: 'observacoes', label: 'Observações', icon: 'description' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClient = () => {
    // Call the API
    handleUpdateClient();
  };

  if (isLoadingClient || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Appointment Details Modal */}
      {/* Appointment Details Modal */}
      <ErrorBoundary>
        <AppointmentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          appointment={selectedAppointment}
        />
      </ErrorBoundary>

      {/* Desktop: Always show "Voltar para Clientes" | Mobile: Show only in menu view */}
      <button
        onClick={onBack}
        className={`mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors ${mobileView === 'content' ? 'hidden md:flex' : ''}`}
      >
        <span className="material-icons mr-2 text-lg">arrow_back</span>
        Voltar para Clientes
      </button>

      {/* Mobile Back Button - Only visible in content view on mobile */}
      {mobileView === 'content' && (
        <button
          onClick={handleMobileBack}
          className="md:hidden mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <span className="material-icons mr-2 text-lg">arrow_back</span>
          Voltar
        </button>
      )}

      {/* Header/Profile Card - Hidden on mobile when viewing content */}
      <div className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-zinc-800 mb-8 animate-fade-in relative overflow-hidden ${mobileView === 'content' ? 'hidden md:block' : ''}`}>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
            <Avatar
              src={client.avatar_url && !client.avatar_url.includes('ui-avatars') ? client.avatar_url : null}
              name={client.name}
              className="w-24 h-24 ring-4 ring-white dark:ring-zinc-800 shadow-xl"
            />
            <button className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              <span className="material-icons text-sm">camera_alt</span>
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-zinc-50 mb-2">{client.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-sm text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="material-icons text-base">email</span>
                <span className="truncate max-w-[150px] md:max-w-none">{client.email}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-icons text-base">phone</span>
                {client.phone}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-icons text-base">cake</span>
                {client.birthDate}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-3 px-6 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
              <span className="material-icons">chat</span>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs - Hidden on mobile when viewing content */}
        <div className={`lg:col-span-1 ${mobileView === 'content' ? 'hidden md:block' : ''}`}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full flex items-center gap-3 p-4 text-sm font-bold transition-all border-l-4 ${activeTab === tab.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <span className="material-icons">{tab.icon}</span>
                {tab.label}
                {/* Mobile arrow indicator */}
                <span className="material-icons ml-auto md:hidden text-gray-400">chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Hidden on mobile when viewing menu */}
        <div className={`lg:col-span-3 ${mobileView === 'menu' ? 'hidden md:block' : ''}`}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-zinc-800 min-h-[400px] md:min-h-[500px]">

            {activeTab === 'dados' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Dados Pessoais</h2>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-primary font-bold text-sm hover:underline">Editar Dados</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="text-gray-400 font-bold text-sm hover:underline">Cancelar</button>
                      <button onClick={handleSaveClient} className="text-green-500 font-bold text-sm hover:underline">Salvar</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Nome Completo</label>
                    <input disabled={!isEditing} name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Data de Nascimento</label>
                    <input disabled={!isEditing} name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">CPF</label>
                    <input disabled={!isEditing} name="cpf" value={formData.cpf || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">RG / Passaporte</label>
                    <input disabled={!isEditing} name="rg" value={formData.rg || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Profissão</label>
                    <input disabled={!isEditing} name="profession" value={formData.profession || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800 mb-8" />

                <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-6">Contato & Social</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">E-mail</label>
                    <input disabled={!isEditing} name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Telefone</label>
                    <input disabled={!isEditing} name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Rede Social</label>
                    <input disabled={!isEditing} name="instagram" value={formData.instagram || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-primary"></div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Endereço</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">CEP</label>
                    <input disabled={!isEditing} name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Rua</label>
                    <input disabled={!isEditing} name="street" value={formData.street || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Número</label>
                    <input disabled={!isEditing} name="number" value={formData.number || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Bairro</label>
                    <input disabled={!isEditing} name="neighborhood" value={formData.neighborhood || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Cidade</label>
                    <input disabled={!isEditing} name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none border border-[#333333]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Estado</label>
                    <input disabled={!isEditing} name="state" value={formData.state || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fidelidade' && (
              <div className="animate-fade-in space-y-8">
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-widest">Saldo de Cashback</p>
                      <h2 className="text-5xl font-extrabold text-primary mb-2">
                        {loadingLoyalty ? (
                          <span className="text-2xl text-gray-500 animate-pulse">Carregando...</span>
                        ) : (
                          `R$ ${loyaltyBalance.balance.toFixed(2)}`
                        )}
                      </h2>
                      {loyaltyBalance.nextExpiration && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span className="material-icons text-sm text-yellow-500">warning</span>
                          Próxima expiração: {new Date(loyaltyBalance.nextExpiration).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <button onClick={() => setShowBalanceModal(true)} className="bg-white text-black font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                        <span className="material-icons">add_circle</span>
                        Adicionar Saldo
                      </button>
                      <button className="bg-transparent border border-white/20 text-white font-bold py-3 px-8 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                        <span className="material-icons">history</span>
                        Ver Regulamento
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                    <span className="material-icons text-primary rounded-full bg-primary/10 p-1">receipt_long</span>
                    Histórico de Movimentações
                  </h3>

                  <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    {loadingLoyalty ? (
                      <div className="p-8 text-center text-gray-500">Carregando histórico...</div>
                    ) : loyaltyHistory.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">Nenhuma movimentação registrada.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {loyaltyHistory.map((transaction) => (
                          <li key={transaction.id} className="p-4 hover:bg-white dark:hover:bg-zinc-800 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'EARN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                <span className="material-icons text-lg">
                                  {transaction.type === 'EARN' ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-zinc-50 text-sm">
                                  {transaction.type === 'EARN' ? 'Cashback Recebido' : 'Resgate Utilizado'}
                                </p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                  {transaction.appointment_id ? ` • Atendimento #${transaction.appointment_id.slice(0, 4)}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`font-bold ${transaction.type === 'EARN' ? 'text-green-500' : 'text-red-500'
                              }`}>
                              {transaction.type === 'EARN' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'atendimentos' && (() => {
              // Server-side pagination is now used
              const currentAppointments = appointments; // Already paginated
              const totalPages = Math.ceil(totalAppointments / appointmentsPerPage);
              const indexOfFirstAppointment = (currentPage - 1) * appointmentsPerPage;
              const indexOfLastAppointment = indexOfFirstAppointment + currentAppointments.length;

              return (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Histórico de Atendimentos</h2>
                  </div>

                  {isLoadingAppointments ? (
                    <div className="p-8 text-center text-gray-500">Carregando atendimentos...</div>
                  ) : appointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-xl">Nenhum atendimento realizado ainda.</div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {currentAppointments.map((app) => (
                          <div key={app.id} className="flex flex-row items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-[#333333] hover:border-primary/50 transition-colors">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-gray-600 dark:text-zinc-400 font-bold shrink-0">
                              <span className="text-lg md:text-xl">
                                {(() => {
                                  const d = new Date(app.date);
                                  return isNaN(d.getTime()) ? '-' : d.getDate();
                                })()}
                              </span>
                              <span className="text-[10px] md:text-xs uppercase">
                                {(() => {
                                  const d = new Date(app.date);
                                  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { month: 'short' });
                                })()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-zinc-50 truncate">{app.service}</h3>
                              <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{app.professional}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedAppointment(app);
                                setIsDetailsModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-primary transition-colors shrink-0"
                            >
                              <span className="material-icons">visibility</span>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-6">
                          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                            Mostrando <span className="text-gray-900 dark:text-zinc-50 font-bold">{indexOfFirstAppointment + 1}</span> a <span className="text-gray-900 dark:text-zinc-50 font-bold">{indexOfFirstAppointment + currentAppointments.length}</span> de <span className="text-gray-900 dark:text-zinc-50 font-bold">{totalAppointments}</span> atendimentos
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="material-icons text-sm">chevron_left</span>
                            </button>
                            <span className="text-sm font-bold text-gray-700 dark:text-zinc-300 px-3">
                              Página {currentPage} de {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="material-icons text-sm">chevron_right</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {activeTab === 'financeiro' && (
              <div className="animate-fade-in space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/20">
                    <p className="text-sm text-green-600 dark:text-green-400 font-bold mb-1 uppercase">Total Gasto</p>
                    <h3 className="text-3xl font-extrabold text-green-700 dark:text-green-300">R$ {financialSummary.total.toFixed(2)}</h3>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase">Ticket Médio</p>
                    <h3 className="text-3xl font-extrabold text-blue-700 dark:text-blue-300">R$ {financialSummary.average.toFixed(2)}</h3>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-bold mb-1 uppercase">Atendimentos Pagos</p>
                    <h3 className="text-3xl font-extrabold text-purple-700 dark:text-purple-300">{financialSummary.count}</h3>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'observacoes' && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Adicionar Nota</h3>
                  <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
                    <textarea
                      rows={3}
                      className="w-full bg-transparent outline-none text-gray-900 dark:text-zinc-50 placeholder-gray-400 resize-none"
                      placeholder="Digite uma observação sobre o cliente..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    ></textarea>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                      <div className="flex gap-2">
                        {/* Icons */}
                      </div>
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isSubmittingNote}
                        className="bg-[#333333] hover:bg-black text-white font-bold py-2 px-6 rounded-lg text-sm shadow-md transition-all disabled:opacity-50"
                      >
                        {isSubmittingNote ? 'Adicionando...' : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {isLoadingNotes ? (
                    <p className="text-center text-gray-400">Carregando...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-center text-gray-400">Nenhuma observação.</p>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className={`p-4 rounded-xl border-l-4 ${note.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'}`}>
                        {editingNoteId === note.id ? (
                          // Edit Mode
                          <div>
                            <textarea
                              className="w-full p-2 border rounded bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 mb-2"
                              rows={3}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={handleCancelEdit} className="text-gray-500 text-sm hover:underline">Cancelar</button>
                              <button onClick={() => handleSaveEdit(note.id)} className="bg-primary text-black px-3 py-1 rounded text-sm font-bold">Salvar</button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className={`font-bold ${note.type === 'warning' ? 'text-yellow-700 dark:text-yellow-500' : 'text-blue-700 dark:text-blue-500'}`}>
                                {note.type === 'warning' ? 'Alerta' : 'Observação'}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 uppercase font-bold mr-2">{new Date(note.created_at).toLocaleDateString()}</span>
                                <button onClick={() => handleEditNote(note)} className="text-gray-400 hover:text-primary transition-colors">
                                  <span className="material-icons text-sm">edit</span>
                                </button>
                                <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                  <span className="material-icons text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{note.content}</p>
                            <p className="text-xs text-gray-400 italic">Por: {note.author_name || 'Sistema'}</p>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md m-4 shadow-2xl border border-gray-200 dark:border-zinc-800">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-50 mb-6">Adicionar Saldo Manual</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Valor (R$)</label>
                <input
                  autoFocus
                  type="number"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-primary outline-none py-2 text-gray-900 dark:text-zinc-50 placeholder-gray-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Motivo / Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Ajuste, Bônus..."
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 font-medium bg-gray-50 dark:bg-zinc-800 outline-none border border-transparent focus:border-primary transition-colors text-gray-900 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowBalanceModal(false)}
                className="flex-1 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualBalance}
                disabled={processingBalance || !balanceAmount}
                className="flex-1 bg-primary text-black font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {processingBalance ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;

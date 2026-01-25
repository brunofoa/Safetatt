import React, { useState, useEffect } from 'react';
import { Client, LoyaltyTransaction } from '../../types';
import { loyaltyService } from '../services/loyaltyService';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

interface ClientProfileProps {
  clientId: string;
  initialTab?: string;
  onBack: () => void;
}

const MOCK_CLIENTS: Record<string, Client> = {
  'c1': {
    id: 'c1',
    name: 'Felix Ferguson',
    email: 'felix.ferguson@email.com',
    phone: '+55 11 9999-9999',
    totalVisits: 12,
    lastVisit: '24 Fev 2024',
    totalSpent: 1250,
    avatar: 'https://picsum.photos/seed/felix/100/100', // Still kept as data, Avatar component handles it if it fails or is used
    address: 'Rua das Flores, 123 - São Paulo, SP',
    birthDate: '15/05/1992',
    instagram: '@felix.ferguson',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    profession: 'Designer Gráfico',
    zipCode: '04587-123',
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Jardim das Rosas',
    city: 'São Paulo',
    state: 'SP'
  }
};

const ClientProfile: React.FC<ClientProfileProps> = ({ clientId, initialTab = 'dados', onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Client Data State
  const [client, setClient] = useState<Client>(MOCK_CLIENTS[clientId] || MOCK_CLIENTS['c1']);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Client>(client);

  // Loyalty State
  const [loyaltyBalance, setLoyaltyBalance] = useState({ balance: 0, nextExpiration: null as string | null });
  const [loyaltyHistory, setLoyaltyHistory] = useState<any[]>([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  useEffect(() => {
    if (activeTab === 'fidelidade') {
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

  // Notes State
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Alerta de Alergia',
      content: 'O cliente relatou sensibilidade a pigmentos vermelhos em experiências anteriores. Usar tinta hipoalergênica se necessário.',
      author: 'Kevin',
      date: '12/01/2024'
    }
  ]);

  const tabs = [
    { id: 'dados', label: 'Dados do Cliente', icon: 'person' },
    { id: 'atendimentos', label: 'Lista de Atendimentos', icon: 'event' },
    { id: 'financeiro', label: 'Financeiro', icon: 'payments' },
    { id: 'fidelidade', label: 'Fidelidade', icon: 'loyalty' },
    { id: 'observacoes', label: 'Observações', icon: 'description' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClient = () => {
    setClient(formData);
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors">
        <span className="material-icons mr-2 text-lg">arrow_back</span>
        Voltar para Clientes
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-zinc-800 mb-8 animate-fade-in relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
            <Avatar
              src={client.avatar}
              name={client.name}
              className="w-24 h-24 ring-4 ring-white dark:ring-zinc-800 shadow-xl"
            />
            <button className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              <span className="material-icons text-sm">camera_alt</span>
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-zinc-50 mb-2">{client.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="material-icons text-base">email</span>
                {client.email}
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
            <button className="bg-[#92FFAD] hover:bg-[#7cefa0] text-black font-bold py-3 px-6 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
              <span className="material-icons">chat</span>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-4 text-sm font-bold transition-all border-l-4 ${activeTab === tab.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <span className="material-icons">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-zinc-800 min-h-[500px]">

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
                    <input disabled={!isEditing} name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Data de Nascimento</label>
                    <input disabled={!isEditing} name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">CPF</label>
                    <input disabled={!isEditing} name="cpf" value={formData.cpf || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">RG / Passaporte</label>
                    <input disabled={!isEditing} name="rg" value={formData.rg || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Profissão</label>
                    <input disabled={!isEditing} name="profession" value={formData.profession || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800 mb-8" />

                <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-6">Contato & Social</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">E-mail</label>
                    <input disabled={!isEditing} name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Telefone</label>
                    <input disabled={!isEditing} name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Rede Social</label>
                    <input disabled={!isEditing} name="instagram" value={formData.instagram || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-primary"></div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Endereço</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">CEP</label>
                    <input disabled={!isEditing} name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Rua</label>
                    <input disabled={!isEditing} name="street" value={formData.street || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Número</label>
                    <input disabled={!isEditing} name="number" value={formData.number || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Bairro</label>
                    <input disabled={!isEditing} name="neighborhood" value={formData.neighborhood || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Cidade</label>
                    <input disabled={!isEditing} name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-medium bg-transparent disabled:opacity-75 focus:ring-2 focus:ring-primary outline-none" />
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
                      <button className="bg-white text-black font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
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
                                  {new Date(transaction.created_at).toLocaleDateString()} • Atendimento #{transaction.appointment_id.slice(0, 4)}
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
                        <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors" title="Alerta"><span className="material-icons">warning</span></button>
                        <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Informação"><span className="material-icons">info</span></button>
                      </div>
                      <button className="bg-[#333333] hover:bg-black text-white font-bold py-2 px-6 rounded-lg text-sm shadow-md transition-all">
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className={`p-4 rounded-xl border-l-4 ${note.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${note.type === 'warning' ? 'text-yellow-700 dark:text-yellow-500' : 'text-blue-700 dark:text-blue-500'}`}>
                          {note.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{note.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{note.content}</p>
                      <p className="text-xs text-gray-400 italic">Por: {note.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab !== 'dados' && activeTab !== 'fidelidade' && activeTab !== 'observacoes') && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="material-icons text-5xl mb-4 opacity-20">construction</span>
                <p>Em desenvolvimento...</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

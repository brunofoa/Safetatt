import React, { useEffect, useState, useMemo } from 'react';
import { Appointment, Client } from '../types';
import { clientService } from '../services/clientService';
import { appointmentService } from '../services/appointmentService';
import { teamService, TeamMember } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    selectedDate: Date | null;
    appointment?: Appointment | null;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, onSuccess, selectedDate, appointment }) => {
    const { currentStudio } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [artists, setArtists] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Client Search
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showClientResults, setShowClientResults] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState({
        professional: '',
        artistId: '',
        client_id: '',
        startTime: '',
        endTime: '',
        status: 'Pendente',
        observations: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
            if (appointment) {
                setFormData({
                    professional: appointment.artist,
                    artistId: appointment.artist_id || '',
                    client_id: appointment.clientId || '',
                    startTime: appointment.startTime ? new Date(appointment.startTime).toISOString().slice(0, 16) : '',
                    endTime: appointment.endTime ? new Date(appointment.endTime).toISOString().slice(0, 16) : '',
                    status: appointment.status,
                    observations: appointment.description,
                });
                if (appointment.clientName) {
                    setClientSearchTerm(appointment.clientName);
                }
            } else {
                setFormData({
                    professional: '',
                    artistId: '',
                    client_id: '',
                    startTime: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
                    endTime: '',
                    status: 'Pendente',
                    observations: ''
                });
                setClientSearchTerm('');
                setSelectedClient(null);
            }
        }
    }, [isOpen, appointment, selectedDate]);

    const loadData = async () => {
        if (!currentStudio?.id) return;
        const [clientsData, teamData] = await Promise.all([
            clientService.getClients(currentStudio.id),
            // Use getProfessionals to only show MASTER, ARTIST, PIERCER (exclude CLIENT)
            teamService.getProfessionals(currentStudio.id)
        ]);
        setClients(clientsData);
        setArtists(teamData);

        if (appointment && appointment.clientId) {
            const client = clientsData.find(c => c.id === appointment.clientId);
            if (client) {
                setSelectedClient(client);
                setClientSearchTerm(client.name);
            }
        }
    };

    const filteredClients = useMemo(() => {
        if (!clientSearchTerm) return [];
        return clients.filter(c =>
            c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
        );
    }, [clients, clientSearchTerm]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (!formData.client_id || !formData.professional || !formData.startTime) {
                alert('Preencha Cliente, Profissional e Data de Início.');
                setIsLoading(false);
                return;
            }

            // Create payload with defaults for session fields being hidden
            const payload = {
                studioId: currentStudio?.id,
                clientId: formData.client_id,
                artistId: formData.artistId,
                professional: formData.professional,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
                status: formData.status,
                observations: formData.observations,
                // Defaults for Session creation (since we are hiding these inputs)
                title: 'Agendamento',
                service_type: 'TATTOO',
                photos: [],
                price: 0,
                size: '',
                body_location: '',
                art_color: '',
                consent_signature_url: ''
            };

            let result;
            if (appointment) {
                result = await appointmentService.updateAppointment(appointment.id, payload);
            } else {
                result = await appointmentService.createAppointment(payload);
            }

            if (result.success) {
                onClose();
                if (onSuccess) onSuccess();
            } else {
                alert('Erro ao salvar agendamento: ' + (result.error?.message || JSON.stringify(result.error)));
            }

        } catch (error) {
            console.error(error);
            alert('Erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    const isEditing = !!appointment;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl animate-fade-in-up">

                {/* Header (Fixed) */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                        {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Professional */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Profissional</label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                                value={formData.professional}
                                onChange={(e) => {
                                    const selected = artists.find(a => a.full_name === e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        professional: e.target.value,
                                        artistId: selected?.profile_id || ''
                                    }));
                                }}
                            >
                                <option value="">Selecione um Profissional</option>
                                {artists.map(artist => (
                                    <option key={artist.id} value={artist.full_name}>
                                        {artist.full_name}
                                    </option>
                                ))}
                            </select>
                            <span className="material-icons absolute right-3 top-3.5 text-gray-500 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Client */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Cliente</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="Buscar cliente..."
                                    value={clientSearchTerm}
                                    onChange={(e) => {
                                        setClientSearchTerm(e.target.value);
                                        setShowClientResults(true);
                                        if (selectedClient && e.target.value !== selectedClient.name) {
                                            setSelectedClient(null);
                                            setFormData(prev => ({ ...prev, client_id: '' }));
                                        }
                                    }}
                                    onFocus={() => setShowClientResults(true)}
                                />
                                {showClientResults && clientSearchTerm && !selectedClient && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                        {filteredClients.length > 0 ? (
                                            filteredClients.map(client => (
                                                <div
                                                    key={client.id}
                                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-between group"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, client_id: client.id }));
                                                        setSelectedClient(client);
                                                        setClientSearchTerm(client.name);
                                                        setShowClientResults(false);
                                                    }}
                                                >
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-zinc-100 text-sm">{client.name}</p>
                                                        <p className="text-xs text-gray-500">{client.email || client.phone}</p>
                                                    </div>
                                                    <span className="material-icons text-[#92FFAD] opacity-0 group-hover:opacity-100">check</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum cliente encontrado</div>
                                        )}
                                    </div>
                                )}
                                {selectedClient && (
                                    <button
                                        onClick={() => {
                                            setSelectedClient(null);
                                            setClientSearchTerm('');
                                            setFormData(prev => ({ ...prev, client_id: '' }));
                                            setShowClientResults(false);
                                        }}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500"
                                    >
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                )}
                            </div>
                            <button
                                className="bg-[#333333] hover:bg-black text-white px-4 rounded-xl flex items-center justify-center transition-colors"
                                title="Adicionar Novo Cliente"
                                onClick={() => alert('Funcionalidade de Novo Cliente Rápido será implementada em breve!')}
                            >
                                <span className="material-icons">add</span>
                            </button>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Status</label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="Pendente">Pendente</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Ausente">Ausente</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                            <span className="material-icons absolute right-3 top-3.5 text-gray-500 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Início</label>
                            <input
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Fim</label>
                            <input
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Observations */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Observações</label>
                        <textarea
                            rows={3}
                            value={formData.observations}
                            onChange={(e) => handleChange('observations', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-[#333333] dark:border-zinc-700 text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder-gray-400 transition-all"
                            placeholder="Detalhes do agendamento..."
                        ></textarea>
                    </div>

                </div>

                {/* Footer (Fixed) */}
                <div className="px-6 py-5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-gray-50 dark:bg-zinc-900/50 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold shadow-lg shadow-[#92FFAD]/20 hover:shadow-[#92FFAD]/40 hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Agendar')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewAppointmentModal;

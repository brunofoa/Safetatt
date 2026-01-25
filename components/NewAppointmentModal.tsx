
import React, { useEffect, useState } from 'react';
import { Appointment } from '../../types';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    appointment?: Appointment | null;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, selectedDate, appointment }) => {
    const [formData, setFormData] = useState({
        professional: '',
        client: '',
        startTime: '',
        endTime: '',
        status: 'Pendente',
        observations: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                // Edit Mode - Populate fields
                // Assuming date/time format for input type="datetime-local" needs "YYYY-MM-DDTHH:mm"
                // For now just using the passed string or iso string directly if it matches
                setFormData({
                    professional: appointment.artist,
                    client: appointment.clientName,
                    startTime: appointment.date.slice(0, 16), // Simplified for mock
                    endTime: '', // Mock data doesn't have end time separate usually
                    status: appointment.status,
                    observations: appointment.description
                });
            } else {
                // New Mode
                setFormData({
                    professional: '',
                    client: '',
                    startTime: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
                    endTime: '',
                    status: 'Pendente',
                    observations: ''
                });
            }
        }
    }, [isOpen, appointment, selectedDate]);

    if (!isOpen) return null;

    const isEditing = !!appointment;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white dark:bg-zinc-900">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                        {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    <div className="grid grid-cols-2 gap-4">
                        {/* Professional */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2">Profissional</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[#333333] text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                                    defaultValue={formData.professional}
                                >
                                    <option>Selecione um Profissional</option>
                                    <option>Alex Rivera</option>
                                    <option>Sarah Jenkins</option>
                                    <option>Roberto Lima</option>
                                    <option>Marcus Thorne</option>
                                    <option>Elena Vanc</option>
                                </select>
                                <span className="material-icons absolute right-3 top-3.5 text-gray-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* Status (Only show if editing or advanced) */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2">Status</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[#333333] text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                                    defaultValue={formData.status}
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
                    </div>

                    {/* Client */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Cliente</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="material-icons absolute left-3 top-3.5 text-gray-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    defaultValue={formData.client}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-[#333333] text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400 transition-all"
                                />
                            </div>
                            <button className="px-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center" title="Novo Cliente">
                                <span className="material-icons text-xl">person_add</span>
                            </button>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Início</label>
                            <input
                                type="datetime-local"
                                defaultValue={formData.startTime}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[#333333] text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Fim</label>
                            <input
                                type="datetime-local"
                                defaultValue={formData.endTime}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[#333333] text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Observations */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Observações</label>
                        <textarea
                            rows={3}
                            defaultValue={formData.observations}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[#333333] text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder-gray-400 transition-all"
                            placeholder="Detalhes sobre a tatuagem, local, etc..."
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold shadow-lg shadow-[#92FFAD]/20 hover:shadow-[#92FFAD]/40 hover:scale-105 transition-all">
                        {isEditing ? 'Salvar Alterações' : 'Agendar'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewAppointmentModal;

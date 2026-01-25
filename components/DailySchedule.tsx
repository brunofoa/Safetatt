
import React from 'react';
import { Appointment } from '../../types';

interface DailyScheduleProps {
    date: Date;
    appointments: Appointment[];
    selectedArtist: string | null;
    onSelectArtist: (artist: string | null) => void;
    onAppointmentClick: (appointment: Appointment) => void;
}

const DailySchedule: React.FC<DailyScheduleProps> = ({ date, appointments, selectedArtist, onSelectArtist, onAppointmentClick }) => {

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const artists = Array.from(new Set(appointments.map(a => a.artist)));

    const getArtistColor = (artistName: string) => {
        const colors: { [key: string]: string } = {
            'Marcus Thorne': '#a855f7', // Purple
            'Elena Vanc': '#3b82f6',    // Blue
            'Sarah Jenkins': '#10b981',  // Emerald
            'Roberto Lima': '#f59e0b',   // Amber
        };
        return colors[artistName] || '#6366f1'; // Default Indigo
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-sm border border-[#333333] h-full min-h-[600px]">

            {/* Header & Filters */}
            <div className="flex flex-col gap-6 mb-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Agendamentos do Dia
                    </h2>
                </div>

                <div className="flex justify-start">
                    {/* Artist Filter Moved Here */}
                    <div className="relative min-w-[200px]">
                        <label className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 block pl-1">Tatuador</label>
                        <select
                            className="w-full px-4 py-2 rounded-xl border border-[#333333] bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:border-primary appearance-none cursor-pointer"
                            value={selectedArtist || ''}
                            onChange={(e) => onSelectArtist(e.target.value || null)}
                        >
                            <option value="">Todos os Artistas</option>
                            {artists.map(artist => (
                                <option key={artist} value={artist}>{artist}</option>
                            ))}
                        </select>
                        <span className="material-icons absolute right-3 top-8 text-gray-400 text-sm pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[9px] top-4 bottom-4 w-[2px] bg-gray-100 dark:bg-white/5 z-0"></div>

                {appointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className="relative z-10 grid grid-cols-[auto_1fr] gap-6 group cursor-pointer"
                        onClick={() => onAppointmentClick(appointment)}
                    >

                        {/* Status Indicator */}
                        <div className="pt-2">
                            <div
                                className="w-5 h-5 rounded-full border-4 bg-white dark:bg-zinc-900 box-content"
                                style={{ borderColor: getArtistColor(appointment.artist) }}
                            >
                                {appointment.status === 'Confirmado' && (
                                    <div className="w-full h-full bg-primary rounded-full scale-50"></div>
                                )}
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="pb-4 border-b border-gray-50 dark:border-white/5 group-last:border-0 hover:pl-2 transition-all duration-300">
                            <p className="text-xs font-bold text-gray-400 tracking-widest mb-1">
                                Sessão • {appointment.time}
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                {appointment.clientName}
                            </h3>

                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span className="material-icons text-xs">person</span>
                                    {appointment.artist}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-icons text-xs">brush</span>
                                    {appointment.description || 'Tattoo'}
                                </span>
                            </div>
                        </div>

                    </div>
                ))}

                {appointments.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <span className="material-icons text-4xl mb-2 opacity-50">event_busy</span>
                        <p>Nenhum agendamento para este dia.</p>
                    </div>
                )}

            </div>

        </div>
    );
};

export default DailySchedule;

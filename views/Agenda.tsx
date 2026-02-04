import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { teamService, TeamMember } from '../services/teamService';
import NewAppointmentModal from '../components/NewAppointmentModal';
import { Appointment } from '../types';
import { usePermissions } from '../hooks/usePermissions';

const Agenda: React.FC = () => {
    const { currentStudio } = useAuth();
    const { permissions, currentUserId } = usePermissions();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [selectedArtist, setSelectedArtist] = useState('all');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [artists, setArtists] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [showCalendar, setShowCalendar] = useState(true);

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    // Load artists - using getProfessionals (only MASTER, ARTIST, PIERCER)
    useEffect(() => {
        const loadArtists = async () => {
            if (!currentStudio?.id) {
                console.warn('⚠️ No studio ID available for loading artists');
                return;
            }

            console.log('🔒 Loading PROFESSIONALS for studio:', currentStudio.id);

            try {
                // Use getProfessionals to get only MASTER, ARTIST, PIERCER (exclude CLIENT)
                const members = await teamService.getProfessionals(currentStudio.id);
                console.log('✅ Loaded professionals:', members.length);
                setArtists(members);
            } catch (error) {
                console.error('❌ Error loading artists:', error);
            }
        };

        loadArtists();
    }, [currentStudio?.id]);

    // Load appointments
    const loadAppointments = useCallback(async () => {
        if (!currentStudio?.id) {
            console.warn('⚠️ No studio ID available for loading appointments');
            return;
        }

        setIsLoading(true);
        console.log('🔒 Loading appointments for studio:', currentStudio.id, 'mode:', viewMode);

        try {
            if (viewMode === 'day') {
                const data = await appointmentService.getByDate(selectedDate, currentStudio.id);
                console.log('✅ Day appointments loaded:', data.length);
                setAppointments(data);
            } else {
                const weekDates = getWeekDates(selectedDate);

                // Fetch appointments for each day of the week
                const allAppointments: Appointment[] = [];
                for (const date of weekDates) {
                    const data = await appointmentService.getByDate(date, currentStudio.id);
                    allAppointments.push(...data);
                }
                console.log('✅ Week appointments loaded:', allAppointments.length);
                setAppointments(allAppointments);
            }
        } catch (error) {
            console.error('❌ Error loading appointments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentStudio?.id, selectedDate, viewMode]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const getWeekDates = (date: Date) => {
        const day = date.getDay();
        const diff = date.getDate() - day;
        const weekDates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            weekDates.push(new Date(date.getFullYear(), date.getMonth(), diff + i));
        }
        return weekDates;
    };

    const hasAppointment = (date: Date) => {
        const dateStr = formatDate(date);
        return appointments.some(app => {
            const appDate = new Date(app.start_time || app.date);
            return formatDate(appDate) === dateStr;
        });
    };

    const getFilteredAppointments = () => {
        let filtered = [...appointments];

        if (viewMode === 'day') {
            const selectedDateStr = formatDate(selectedDate);
            filtered = filtered.filter(app => {
                const appDate = new Date(app.start_time || app.date);
                return formatDate(appDate) === selectedDateStr;
            });
        }

        // If user doesn't have permission to view all, only show their own appointments
        if (!permissions.canViewAllAgenda && currentUserId) {
            filtered = filtered.filter(app => app.artist_id === currentUserId);
        }

        // Filter by selected artist (using profile_id) - only if user has permission
        if (permissions.canViewAllAgenda && selectedArtist !== 'all') {
            filtered = filtered.filter(app => {
                // Check artist_id (profile_id) or match by artist name
                const artistMatch =
                    app.artist_id === selectedArtist ||
                    app.artist?.toLowerCase() === artists.find(a => a.profile_id === selectedArtist)?.full_name?.toLowerCase();
                return artistMatch;
            });
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.start_time || a.date);
            const dateB = new Date(b.start_time || b.date);
            return dateA.getTime() - dateB.getTime();
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleNewAppointment = () => {
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
    };

    const filteredAppointments = getFilteredAppointments();
    const weekDates = getWeekDates(selectedDate);

    return (
        <div className="px-4 md:px-6 max-w-7xl mx-auto min-h-screen pb-20">
            {/* Modal */}
            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                appointment={editingAppointment}
                onSuccess={loadAppointments}
            />

            {/* Header */}
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50 mb-1">
                        Agenda
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 font-medium text-sm">
                        Gerencie seus agendamentos
                    </p>
                </div>

                {/* Mobile: Toggle Calendar Button */}
                <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-sm"
                >
                    <span className="material-icons text-lg">{showCalendar ? 'event_busy' : 'calendar_month'}</span>
                    {showCalendar ? 'Ocultar Calendário' : 'Mostrar Calendário'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start">
                {/* Mini Calendar Card - Collapsible on mobile */}
                <div className={`w-full lg:w-72 flex-shrink-0 ${showCalendar ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#333333] dark:border-zinc-800 p-4 md:p-5">
                        {/* Month Navigation */}
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={prevMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <span className="material-icons text-gray-600 dark:text-zinc-400 text-xl">chevron_left</span>
                            </button>
                            <span className="font-bold text-sm text-gray-900 dark:text-zinc-50">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </span>
                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <span className="material-icons text-gray-600 dark:text-zinc-400 text-xl">chevron_right</span>
                            </button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-0.5">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="p-2" />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                                const hasAppt = hasAppointment(date);
                                const selected = isSelected(date);
                                const today = isToday(date);

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={`relative p-2 rounded-lg text-sm font-medium transition-all
                      ${selected
                                                ? 'bg-black dark:bg-white text-white dark:text-black font-bold'
                                                : today
                                                    ? 'text-primary font-bold'
                                                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        {i + 1}
                                        {hasAppt && !selected && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* New Appointment Button */}
                        <button
                            onClick={handleNewAppointment}
                            className="w-full mt-5 py-3.5 rounded-xl btn-gradient text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <span className="material-icons text-lg">add</span>
                            Novo Agendamento
                        </button>
                    </div>
                </div>

                {/* Appointments List Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#333333] dark:border-zinc-800 p-4 md:p-6 flex-1 min-h-[400px] md:min-h-[500px] w-full">
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50">
                            Agendamentos
                        </h2>

                        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('day')}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs transition-all
                    ${viewMode === 'day'
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
                                        }`}
                                >
                                    Dia
                                </button>
                                <button
                                    onClick={() => setViewMode('week')}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs transition-all
                    ${viewMode === 'week'
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
                                        }`}
                                >
                                    Semana
                                </button>
                            </div>

                            {/* Artist Filter - Only show if user can view all agenda */}
                            {permissions.canViewAllAgenda && (
                                <select
                                    value={selectedArtist}
                                    onChange={(e) => setSelectedArtist(e.target.value)}
                                    className="px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-primary cursor-pointer min-w-[140px]"
                                >
                                    <option value="all">Todos os Artistas</option>
                                    {artists.map(artist => (
                                        <option key={artist.id} value={artist.profile_id}>
                                            {artist.full_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Week View Header */}
                    {viewMode === 'week' && (
                        <div className="flex gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2">
                            {weekDates.map((date, idx) => {
                                const isSelectedDay = isSelected(date);
                                const hasAppt = hasAppointment(date);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 rounded-xl border text-center transition-all min-w-[50px] sm:min-w-[70px]
                      ${isSelectedDay
                                                ? 'border-black dark:border-white bg-gray-50 dark:bg-zinc-800'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-[9px] sm:text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase mb-0.5 sm:mb-1">
                                            {dayNames[date.getDay()]}
                                        </div>
                                        <div className={`text-sm sm:text-base font-bold ${isSelectedDay ? 'text-black dark:text-white' : 'text-gray-700 dark:text-zinc-300'}`}>
                                            {date.getDate()}
                                        </div>
                                        {hasAppt && (
                                            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-primary mx-auto mt-1 sm:mt-1.5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Selected Date Display */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                        <span className="text-sm font-bold text-gray-900 dark:text-zinc-50">
                            {viewMode === 'day'
                                ? `${dayNames[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`
                                : `Semana de ${weekDates[0].getDate()} - ${weekDates[6].getDate()} ${monthNames[weekDates[0].getMonth()]}`
                            }
                        </span>
                        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                            {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Appointments List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16 text-gray-400">
                                <span className="material-icons animate-spin mr-2">sync</span>
                                Carregando...
                            </div>
                        ) : filteredAppointments.length > 0 ? (
                            filteredAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    onClick={() => handleEditAppointment(appointment)}
                                    className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer transition-all hover:border-gray-400 dark:hover:border-zinc-500 hover:shadow-md gap-3 sm:gap-4 group"
                                >
                                    {/* Mobile: Top Row with Time and Artist */}
                                    <div className="flex items-center justify-between sm:contents">
                                        {/* Time Column */}
                                        <div className="min-w-[60px] sm:min-w-[70px] text-left sm:text-center">
                                            {viewMode === 'week' && (
                                                <div className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">
                                                    {dayNames[new Date(appointment.start_time || appointment.date).getDay()]}
                                                </div>
                                            )}
                                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-50">
                                                {appointment.time?.split(' - ')[0] || new Date(appointment.start_time || appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {/* Mobile: Artist Badge (shown on right on mobile) */}
                                        <div
                                            className="flex sm:hidden items-center gap-2 px-2.5 py-1 rounded-full"
                                            style={{ backgroundColor: `${appointment.artistColor || '#92FFAD'}20` }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: appointment.artistColor || '#92FFAD' }}
                                            />
                                            <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 truncate max-w-[80px]">
                                                {appointment.artist}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Desktop: Divider */}
                                    <div
                                        className="hidden sm:block w-1 h-10 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: appointment.artistColor || '#92FFAD' }}
                                    />

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 dark:text-zinc-50 mb-0.5 truncate">
                                            {appointment.clientName}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium truncate">
                                            {appointment.title}
                                        </div>
                                    </div>

                                    {/* Desktop: Artist Badge */}
                                    <div
                                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: `${appointment.artistColor || '#92FFAD'}20` }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: appointment.artistColor || '#92FFAD' }}
                                        />
                                        <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                            {appointment.artist}
                                        </span>
                                    </div>

                                    {/* Action Button */}
                                    <button className="hidden sm:flex p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400 group-hover:bg-primary group-hover:text-black transition-all flex-shrink-0">
                                        <span className="material-icons text-lg">chevron_right</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-400">
                                <span className="material-icons text-4xl sm:text-5xl mb-3 opacity-30">event_busy</span>
                                <span className="font-semibold text-sm">Nenhum agendamento</span>
                                <span className="text-xs mt-1">
                                    {viewMode === 'day' ? 'para este dia' : 'para esta semana'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: Floating New Appointment Button */}
            <button
                onClick={handleNewAppointment}
                className="lg:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full btn-gradient text-black font-bold shadow-xl shadow-primary/30 flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all"
            >
                <span className="material-icons text-2xl">add</span>
            </button>
        </div>
    );
};

export default Agenda;

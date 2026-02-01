import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewAppointmentModal from '../components/NewAppointmentModal';
import { Appointment } from '../types';
import { appointmentService } from '../services/appointmentService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/agenda-calendar.css';

// Configure date-fns localizer for Portuguese
const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// Custom messages in Portuguese
const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Lista',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há agendamentos neste período.',
    showMore: (total: number) => `+ ${total} mais`,
};

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    resource: Appointment;
    status: string;
}

interface AgendaProps {
    onNewAppointment?: () => void;
}

const Agenda: React.FC<AgendaProps> = () => {
    const { currentStudio } = useAuth();
    const [view, setView] = useState<View>('week'); // Default to week view
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Load appointments for the current view's date range
    const loadAppointments = useCallback(async () => {
        if (!currentStudio?.id) return;

        // Calculate date range based on current view
        let startDate: Date;
        let endDate: Date;

        if (view === 'month') {
            startDate = startOfMonth(date);
            endDate = endOfMonth(date);
        } else if (view === 'week') {
            startDate = startOfWeek(date, { locale: ptBR });
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
        } else if (view === 'day') {
            startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Agenda view - show next 30 days
            startDate = new Date();
            endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
        }

        try {
            setErrorMsg(null);
            console.log('Fetching appointments for range:', {
                studioId: currentStudio.id,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                view
            });

            const response = await appointmentService.getAppointments(
                currentStudio.id,
                startDate.toISOString(),
                endDate.toISOString()
            );

            console.log('API Response:', response);

            // Handle response format { success, data, error }
            if (!response.success || !response.data) {
                console.error('Error loading appointments:', response.error);
                setErrorMsg(response.error?.message || 'Erro ao carregar agendamentos');
                setEvents([]);
                return;
            }

            const appointments = response.data;
            console.log('Raw Appointments:', appointments);

            // Map appointments to calendar events
            const calendarEvents: CalendarEvent[] = appointments.map((appt: any) => {
                // Parse scheduled_date and scheduled_time
                const datePart = appt.scheduled_date; // YYYY-MM-DD
                const timePart = appt.scheduled_time || '00:00:00'; // HH:MM:SS
                const start = new Date(`${datePart}T${timePart}`);
                const end = new Date(start.getTime() + (appt.duration_minutes || 60) * 60000);

                return {
                    title: `${appt.clients?.name || appt.clients?.full_name || 'Cliente'} - ${appt.appointment_type || 'Atendimento'}`,
                    start,
                    end,
                    resource: {
                        id: appt.id,
                        clientName: appt.clients?.name || appt.clients?.full_name || 'Cliente',
                        artist: appt.profiles?.full_name || 'Profissional',
                        artistColor: appt.profiles?.display_color,
                        status: appt.status,
                        title: appt.appointment_type || 'Atendimento',
                        description: appt.notes || '',
                        date: start.toISOString(),
                        start_time: start.toISOString(),
                        end_time: end.toISOString(),
                        time: `${timePart.slice(0, 5)} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                        clientAvatar: '',
                        photos: [],
                        tattooImage: null,
                    } as Appointment,
                    status: appt.status,
                };
            }).filter((event: CalendarEvent) => {
                const isValid = event.start instanceof Date && !isNaN(event.start.getTime()) &&
                    event.end instanceof Date && !isNaN(event.end.getTime());

                if (!isValid) {
                    console.warn('⚠️ Invalid Date found in appointment:', event.resource);
                }
                return isValid;
            });

            console.log('Mapped Events:', calendarEvents);

            setEvents(calendarEvents);
        } catch (error: any) {
            console.error('Error loading appointments:', error);
            setErrorMsg(error.message || 'Erro inesperado');
        }
    }, [currentStudio?.id, date, view]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    // Event style getter - color code by artist or status
    const eventStyleGetter = (event: CalendarEvent) => {
        const statusColors: Record<string, { backgroundColor: string; borderColor: string }> = {
            'confirmed': { backgroundColor: '#10b981', borderColor: '#059669' }, // Green
            'Confirmado': { backgroundColor: '#10b981', borderColor: '#059669' },
            'pending': { backgroundColor: '#f59e0b', borderColor: '#d97706' }, // Yellow
            'Pendente': { backgroundColor: '#f59e0b', borderColor: '#d97706' },
            'cancelled': { backgroundColor: '#ef4444', borderColor: '#dc2626' }, // Red
            'Cancelado': { backgroundColor: '#ef4444', borderColor: '#dc2626' },
            'completed': { backgroundColor: '#6366f1', borderColor: '#4f46e5' }, // Blue
            'Finalizado': { backgroundColor: '#6366f1', borderColor: '#4f46e5' },
            'Concluído': { backgroundColor: '#6366f1', borderColor: '#4f46e5' },
            'no_show': { backgroundColor: '#6b7280', borderColor: '#4b5563' }, // Gray
            'No Show': { backgroundColor: '#6b7280', borderColor: '#4b5563' },
            'Ausente': { backgroundColor: '#6b7280', borderColor: '#4b5563' },
        };

        const statusColor = statusColors[event.status] || statusColors['pending'];
        const artistColor = event.resource?.artistColor;

        return {
            style: {
                backgroundColor: artistColor || statusColor.backgroundColor,
                borderColor: artistColor || statusColor.borderColor,
                color: artistColor ? '#000000' : 'white',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: '700',
            },
        };
    };

    // Handle event click - open edit modal
    const handleSelectEvent = (event: CalendarEvent) => {
        setEditingAppointment(event.resource);
        setIsModalOpen(true);
    };

    // Handle slot selection - open new appointment modal
    const handleSelectSlot = (slotInfo: any) => {
        setSelectedDate(slotInfo.start);
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    // Handle view change
    const handleViewChange = (newView: View) => {
        setView(newView);
    };

    // Handle navigation
    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
    };

    // Custom Toolbar Component
    const CustomToolbar = (toolbarProps: any) => {
        const goToBack = () => {
            const currentDate = toolbarProps.date;
            let newDate;

            switch (view) {
                case 'month':
                    newDate = subMonths(currentDate, 1);
                    break;
                case 'week':
                    newDate = subWeeks(currentDate, 1);
                    break;
                case 'day':
                    newDate = subDays(currentDate, 1);
                    break;
                case 'agenda':
                    newDate = subDays(currentDate, 1);
                    break;
                default:
                    newDate = subDays(currentDate, 1);
            }
            toolbarProps.onNavigate(newDate);
        };

        const goToNext = () => {
            const currentDate = toolbarProps.date;
            let newDate;

            switch (view) {
                case 'month':
                    newDate = addMonths(currentDate, 1);
                    break;
                case 'week':
                    newDate = addWeeks(currentDate, 1);
                    break;
                case 'day':
                    newDate = addDays(currentDate, 1);
                    break;
                case 'agenda':
                    newDate = addDays(currentDate, 1);
                    break;
                default:
                    newDate = addDays(currentDate, 1);
            }
            toolbarProps.onNavigate(newDate);
        };

        const goToCurrent = () => {
            toolbarProps.onNavigate(new Date());
        };

        const label = () => {
            const date = toolbarProps.date;
            return (
                <span className="capitalize">
                    {format(date, view === 'day' ? "EEEE, d 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
                </span>
            );
        };

        return (
            <div className="rbc-toolbar">
                <div className="rbc-btn-group">
                    <button type="button" onClick={goToBack}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button type="button" onClick={goToCurrent}>Hoje</button>
                    <button type="button" onClick={goToNext}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="rbc-toolbar-label">{label()}</div>

                <div className="rbc-btn-group hidden md:flex">
                    <button
                        type="button"
                        className={view === 'month' ? 'rbc-active' : ''}
                        onClick={() => toolbarProps.onView('month')}
                    >
                        Mês
                    </button>
                    <button
                        type="button"
                        className={view === 'week' ? 'rbc-active' : ''}
                        onClick={() => toolbarProps.onView('week')}
                    >
                        Semana
                    </button>
                    <button
                        type="button"
                        className={view === 'day' ? 'rbc-active' : ''}
                        onClick={() => toolbarProps.onView('day')}
                    >
                        Dia
                    </button>
                    <button
                        type="button"
                        className={view === 'agenda' ? 'rbc-active' : ''}
                        onClick={() => toolbarProps.onView('agenda')}
                    >
                        Lista
                    </button>
                </div>
            </div>
        );
    };

    // Update view based on screen size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setView(prev => (prev === 'week' || prev === 'month' ? 'day' : prev));
            } else {
                setView(prev => (prev === 'day' || prev === 'agenda' ? 'week' : prev));
            }
        };

        // Set initial view
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Custom Event Component
    const CustomEvent = ({ event }: any) => {
        return (
            <div className="h-full w-full flex flex-col justify-start overflow-hidden leading-tight p-0.5">
                <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-bold opacity-75 truncate" style={{ color: 'inherit' }}>
                        {event.resource.time.split(' - ')[0]}
                    </span>
                </div>
                <div className="font-bold text-xs truncate" style={{ color: 'inherit' }}>
                    {event.resource.clientName}
                </div>
                {event.resource.artist && (
                    <div className="text-[9px] opacity-75 truncate" style={{ color: 'inherit' }}>
                        {event.resource.artist.split(' ')[0]}
                    </div>
                )}
            </div>
        );
    };

    // Custom Agenda View matching the design
    const CustomAgendaView = () => {
        // Group events by date
        const groupedEvents = events.reduce((acc: any, event) => {
            const dateKey = format(event.start, 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(event);
            return acc;
        }, {});

        // Sort dates
        const sortedDates = Object.keys(groupedEvents).sort();

        // Status mapping for badges
        const getStatusBadge = (status: string) => {
            const statusMap: Record<string, { label: string, color: string, bg: string }> = {
                'confirmed': { label: 'CONFIRMADO', color: '#10b981', bg: '#d1fae5' },
                'Confirmado': { label: 'CONFIRMADO', color: '#10b981', bg: '#d1fae5' },
                'pending': { label: 'PENDENTE', color: '#f59e0b', bg: '#fef3c7' },
                'Pendente': { label: 'PENDENTE', color: '#f59e0b', bg: '#fef3c7' },
                'cancelled': { label: 'CANCELADO', color: '#ef4444', bg: '#fee2e2' },
                'Cancelado': { label: 'CANCELADO', color: '#ef4444', bg: '#fee2e2' },
                'completed': { label: 'FINALIZADO', color: '#f97316', bg: '#ffedd5' },
                'Finalizado': { label: 'FINALIZADO', color: '#f97316', bg: '#ffedd5' },
                'Ausente': { label: 'AUSENTE', color: '#6b7280', bg: '#f3f4f6' }
            };
            return statusMap[status] || { label: status.toUpperCase(), color: '#6b7280', bg: '#f3f4f6' };
        };

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-white rounded-2xl">
                {sortedDates.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        Não há agendamentos para este período.
                    </div>
                ) : (
                    sortedDates.map(dateKey => {
                        const dateEvents = groupedEvents[dateKey].sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
                        const dateObj = new Date(dateKey + 'T00:00:00');

                        return (
                            <div key={dateKey} className="mb-8">
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SESSÕES DO DIA</h3>
                                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                                        {format(dateObj, "d 'de' MMMM", { locale: ptBR })}
                                    </h2>
                                </div>

                                <div className="space-y-0 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-100"></div>

                                    {dateEvents.map((event: CalendarEvent, idx: number) => {
                                        const badge = getStatusBadge(event.status);
                                        const artistName = event.resource.artist || 'Profissional';

                                        return (
                                            <div key={idx} className="relative flex items-start gap-6 py-4 hover:bg-gray-50 rounded-xl transition-colors px-4 -mx-4 group">
                                                {/* Timeline Dot */}
                                                <div
                                                    className="w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 flex-shrink-0 mt-1"
                                                    style={{ backgroundColor: event.resource.artistColor || '#3b82f6' }}
                                                ></div>

                                                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    {/* Info */}
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-400 mb-1">
                                                            {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {event.resource.clientName}
                                                        </h3>
                                                        <p className="text-sm text-gray-400 italic font-medium">
                                                            {artistName}
                                                        </p>
                                                    </div>

                                                    {/* Status & Actions */}
                                                    <div className="flex items-center gap-4">
                                                        <span
                                                            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                                                            style={{ backgroundColor: badge.bg, color: badge.color }}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                        <button
                                                            onClick={() => handleSelectEvent(event)}
                                                            className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-100"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    return (
        <ErrorBoundary>
            <div className="h-full flex flex-col gap-6">
                {/* Modal */}
                <NewAppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    appointment={editingAppointment}
                    onSuccess={loadAppointments}
                />

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Agenda</h1>
                        <p className="text-zinc-400 mt-1">
                            Visualize e gerencie seus agendamentos ({events.length} carregados)
                        </p>
                        {errorMsg && (
                            <p className="text-red-500 font-bold text-sm mt-1 bg-red-100 p-2 rounded">
                                {errorMsg}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setSelectedDate(new Date());
                            setEditingAppointment(null);
                            setIsModalOpen(true);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Novo Agendamento
                    </button>
                </div>

                {/* Calendar */}
                <div className={`flex-1 bg-white rounded-2xl border border-[#333333] overflow-hidden flex flex-col ${view === 'agenda' ? '' : 'p-4 md:p-6'}`}>

                    {/* Custom Toolbar Rendering for consistency */}
                    <CustomToolbar
                        date={date}
                        view={view}
                        onNavigate={handleNavigate}
                        onView={handleViewChange}
                    />

                    {view === 'agenda' ? (
                        <CustomAgendaView />
                    ) : (
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}
                            view={view}
                            onView={handleViewChange}
                            date={date}
                            onNavigate={handleNavigate}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            selectable
                            popup
                            messages={messages}
                            culture="pt-BR"
                            eventPropGetter={eventStyleGetter}
                            views={['month', 'week', 'day', 'agenda']}
                            components={{
                                toolbar: () => null, // Hide default toolbar since we render CustomToolbar above
                                event: CustomEvent
                            }}
                            step={30}
                            timeslots={2}
                            min={new Date(0, 0, 0, 7, 0, 0)} // Start at 7 AM
                            max={new Date(0, 0, 0, 22, 0, 0)} // End at 10 PM
                        />
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Agenda;

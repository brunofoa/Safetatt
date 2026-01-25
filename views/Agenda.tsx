
import React, { useState } from 'react';
import CalendarWidget from '../components/CalendarWidget';
import DailySchedule from '../components/DailySchedule';
import NewAppointmentModal from '../components/NewAppointmentModal';
import { Appointment } from '../../types';

interface AgendaProps {
    onNewAppointment?: () => void; // Optional now, as we handle it internally
}

// Mock Data for Demo
const getMockAppointments = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
        { id: '1', date: today.toISOString(), time: '10:00 - 12:30', clientName: 'Alex Rivera', clientAvatar: '', artist: 'Marcus Thorne', status: 'Confirmado', title: 'Sessão', description: 'Realismo' },
        { id: '2', date: today.toISOString(), time: '13:00 - 15:30', clientName: 'Sarah Jenkins', clientAvatar: '', artist: 'Elena Vanc', status: 'Pendente', title: 'Sessão', description: 'Fineline' },
        { id: '3', date: today.toISOString(), time: '16:00 - 16:30', clientName: 'Roberto Lima', clientAvatar: '', artist: 'Marcus Thorne', status: 'Confirmado', title: 'Avaliação', description: 'Blackwork' },
        { id: '4', date: tomorrow.toISOString(), time: '09:00 - 11:00', clientName: 'Jessica Jones', clientAvatar: '', artist: 'Roberto Lima', status: 'Confirmado', title: 'Sessão', description: 'Old School' },
    ];
};

const Agenda: React.FC<AgendaProps> = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Filter Logic
    const appointments = React.useMemo(() => getMockAppointments(), []);

    const filteredAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        const isSameDate =
            appDate.getDate() === selectedDate.getDate() &&
            appDate.getMonth() === selectedDate.getMonth() &&
            appDate.getFullYear() === selectedDate.getFullYear();

        if (!isSameDate) return false;
        if (selectedArtist && app.artist !== selectedArtist) return false;

        return true;
    });

    const handleNewAppointment = () => {
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative">

            {/* Modal */}
            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                appointment={editingAppointment}
            />

            {/* Sidebar - Calendar */}
            <div className="md:col-span-4 lg:col-span-3">
                <CalendarWidget
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onNewAppointment={handleNewAppointment}
                />
            </div>

            {/* Main Content - Schedule */}
            <div className="md:col-span-8 lg:col-span-9 h-full">
                <DailySchedule
                    date={selectedDate}
                    appointments={filteredAppointments}
                    selectedArtist={selectedArtist}
                    onSelectArtist={setSelectedArtist}
                    onAppointmentClick={handleEditAppointment}
                />
            </div>

        </div>
    );
};

export default Agenda;

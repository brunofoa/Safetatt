
import React, { useState } from 'react';

interface CalendarWidgetProps {
    onDateSelect: (date: Date) => void;
    selectedDate: Date;
    onNewAppointment: () => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onDateSelect, selectedDate, onNewAppointment }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    const renderCalendarDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            days.push(
                <button
                    key={i}
                    onClick={() => onDateSelect(date)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected
                            ? 'bg-black text-white shadow-lg scale-110'
                            : isToday
                                ? 'text-primary font-bold border border-primary/30'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
                        }
                `}
                >
                    {i}
                    {isToday && !isSelected && <div className="absolute w-1 h-1 bg-primary rounded-full bottom-2"></div>}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border border-[#333333] h-fit">

            {/* Header Month/Year */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {monthNames[currentMonth.getMonth()]}, {currentMonth.getFullYear().toString().slice(-2)}
                    </h2>
                    <p className="text-gray-400 text-sm font-medium capitalize">
                        {currentMonth.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-400">
                        <span className="material-icons text-sm">chevron_left</span>
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-400">
                        <span className="material-icons text-sm">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {weekDays.map(day => (
                    <span key={day} className="text-[10px] font-bold text-gray-400 tracking-wider py-2">
                        {day}
                    </span>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 place-items-center mb-8">
                {renderCalendarDays()}
            </div>

            {/* New Appointment Button */}
            <button
                onClick={onNewAppointment}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold shadow-lg shadow-[#92FFAD]/20 hover:shadow-[#92FFAD]/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
                <span className="material-icons text-xl">add</span>
                Novo Agendamento
            </button>

        </div>
    );
};

export default CalendarWidget;

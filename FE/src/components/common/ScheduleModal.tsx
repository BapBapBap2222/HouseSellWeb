import { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import type { PropertyAvailabilityDay } from '@/lib/propertiesApi';

export interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (date: Date, isCustom: boolean, selectedTime?: string) => void;
    propertyName?: string;
    availabilitySchedule?: PropertyAvailabilityDay[];
}

const addOneHour = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const endHour = hour + 1;
    return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const expandScheduleSlots = (dayName: string, schedule?: PropertyAvailabilityDay[]) => {
    const day = schedule?.find((item) => item.dayOfWeek.toLowerCase() === dayName.toLowerCase() && item.enabled);
    if (!day || !day.slots.length) return [];

    const expanded = new Set<string>();
    day.slots.forEach((slot) => {
        if (!slot.start || !slot.end) return;
        let cursor = slot.start;
        while (cursor < slot.end) {
            expanded.add(cursor);
            const next = addOneHour(cursor);
            if (next <= cursor) break;
            cursor = next;
        }
    });

    return Array.from(expanded).sort();
};

export const ScheduleModal = ({ isOpen, onClose, onSchedule, propertyName, availabilitySchedule }: ScheduleModalProps) => {
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isProposingCustom, setIsProposingCustom] = useState(false);
    
    // Custom Time States
    const [customDate, setCustomDate] = useState("");
    const [customTime, setCustomTime] = useState("");

    useEffect(() => {
        if (isOpen) {
            setIsProposingCustom(false);
            setSelectedDateIndex(0);
            setSelectedTime(null);
            setCustomDate("");
            setCustomTime("");
        }
    }, [isOpen]);

    // Generate the next 7 days
    const next7Days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
    }, []);

    const hasConfiguredAvailability = useMemo(() => {
        return Boolean(availabilitySchedule?.some((day) => day.enabled && day.slots.length > 0));
    }, [availabilitySchedule]);

    const availableTimeSlots = useMemo(() => {
        const selectedDay = next7Days[selectedDateIndex];
        const dayName = format(selectedDay, 'EEEE');
        const expanded = expandScheduleSlots(dayName, availabilitySchedule);
        if (expanded.length > 0) return expanded;
        return hasConfiguredAvailability ? [] : [];
    }, [availabilitySchedule, hasConfiguredAvailability, next7Days, selectedDateIndex]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (isProposingCustom) {
            if (!customDate || !customTime) return; // Basic validation
            // Combine custom date/time into a Date object (simplified for mock)
            const d = new Date(`${customDate}T${customTime}`);
            onSchedule(d, true, customTime);
        } else {
            if (!selectedTime) return;
            const selectedDay = next7Days[selectedDateIndex];
            const [hour, minute] = selectedTime.split(':').map(Number);
            const appointmentDate = new Date(selectedDay);
            appointmentDate.setHours(hour, minute, 0, 0);
            onSchedule(appointmentDate, false, selectedTime);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Schedule Viewing</h2>
                        {propertyName && <p className="text-sm text-gray-500 mt-1 truncate max-w-[300px]">{propertyName}</p>}
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto w-full flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                    
                    {!isProposingCustom ? (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Select a Day (Next 7 Days)
                            </h3>
                            
                            {/* Horizontal Day Scroller */}
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x">
                                {next7Days.map((date, idx) => {
                                    const isSelected = selectedDateIndex === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedDateIndex(idx);
                                                setSelectedTime(null); // Reset time when day changes
                                            }}
                                            className={cn(
                                                "flex-shrink-0 snap-start flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all w-[70px]",
                                                isSelected 
                                                    ? "border-primary bg-primary/5 text-primary" 
                                                    : "border-gray-100 hover:border-gray-200 bg-white text-gray-600"
                                            )}
                                        >
                                            <span className="text-xs font-semibold uppercase tracking-wider mb-1">
                                                {format(date, 'EEE')}
                                            </span>
                                            <span className="text-lg font-bold">
                                                {format(date, 'd')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <h3 className="font-semibold text-gray-700 mt-4 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Available Times
                            </h3>

                            {/* Time Slots Grid */}
                            {availableTimeSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                    {availableTimeSlots.map((time) => {
                                        const isSelected = selectedTime === time;

                                        return (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={cn(
                                                    "py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border",
                                                    isSelected
                                                        ? "bg-primary text-white border-primary shadow-sm"
                                                        : "bg-white border-gray-200 hover:border-primary text-gray-700 hover:text-primary"
                                                )}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mb-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                    No available time slots for this day.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                Propose Custom Time
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                If the available slots don't work for you, select a different date and time. The seller will review your request.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Date</label>
                                    <input 
                                        type="date" 
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Time</label>
                                    <input 
                                        type="time" 
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto flex flex-col gap-3">
                    
                    {!isProposingCustom && (
                        <button 
                            onClick={() => setIsProposingCustom(true)}
                            className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-1 transition-colors w-full py-2"
                        >
                            Not satisfied? Propose another time <ChevronRight className="w-4 h-4" />
                        </button>
                    )}

                    {isProposingCustom && (
                        <button 
                            onClick={() => setIsProposingCustom(false)}
                            className="text-sm text-muted-foreground hover:text-gray-900 font-medium transition-colors w-full text-left mb-2 underline"
                        >
                            Back to Seller's Availability
                        </button>
                    )}

                    <Button 
                        onClick={handleConfirm}
                        disabled={isProposingCustom ? (!customDate || !customTime) : !selectedTime}
                        className={cn(
                            "w-full h-12 text-base font-bold",
                            isProposingCustom ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : ""
                        )}
                    >
                        {isProposingCustom ? "Send Request" : "Confirm Appointment"}
                    </Button>
                </div>
            </div>
        </div>
    );
};


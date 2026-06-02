import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, RotateCcw, Save, X } from "lucide-react";
import { addDays, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  dayOfWeek: string;
  enabled: boolean;
  slots: TimeSlot[];
}

export type AvailabilitySchedule = DayAvailability[];

interface GlobalAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchedule: AvailabilitySchedule;
  onSave: (schedule: AvailabilitySchedule) => void;
  propertyName?: string;
}

const TIME_OPTIONS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const addOneHour = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const normalizeSchedule = (schedule: AvailabilitySchedule): AvailabilitySchedule =>
  schedule.map((day) => ({
    ...day,
    slots: [...day.slots].sort((a, b) => a.start.localeCompare(b.start)),
  }));

export const GlobalAvailabilityModal = ({
  isOpen,
  onClose,
  initialSchedule,
  onSave,
  propertyName,
}: GlobalAvailabilityModalProps) => {
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(initialSchedule);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSchedule(normalizeSchedule(initialSchedule));
      setSelectedDayIndex(0);
    }
  }, [initialSchedule, isOpen]);

  const next7Days = useMemo(() => Array.from({ length: 7 }).map((_, index) => addDays(new Date(), index)), []);

  if (!isOpen) return null;

  const selectedDay = schedule[selectedDayIndex];

  const hasSlot = (time: string) =>
    selectedDay.slots.some((slot) => slot.start === time && slot.end === addOneHour(time));

  const toggleTimeSlot = (time: string) => {
    setSchedule((current) =>
      current.map((day, index) => {
        if (index !== selectedDayIndex) return day;

        const nextSlot = { start: time, end: addOneHour(time) };
        const exists = day.slots.some((slot) => slot.start === nextSlot.start && slot.end === nextSlot.end);
        const nextSlots = exists
          ? day.slots.filter((slot) => !(slot.start === nextSlot.start && slot.end === nextSlot.end))
          : [...day.slots, nextSlot].sort((a, b) => a.start.localeCompare(b.start));

        return {
          ...day,
          enabled: nextSlots.length > 0,
          slots: nextSlots,
        };
      }),
    );
  };

  const resetSelectedDay = () => {
    setSchedule((current) =>
      current.map((day, index) =>
        index === selectedDayIndex
          ? {
              ...day,
              enabled: false,
              slots: [],
            }
          : day,
      ),
    );
  };

  const handleSave = () => {
    onSave(normalizeSchedule(schedule));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] shadow-xl w-full max-w-[660px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[2rem] font-bold text-gray-900 leading-none">Schedule Viewing</h2>
            {propertyName && <p className="text-sm text-gray-500 mt-2 truncate max-w-[360px]">{propertyName}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto w-full flex-1 scrollbar-thin scrollbar-thumb-gray-200">
          <div>
            <h3 className="font-semibold text-[1rem] text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Select a Day (Next 7 Days)
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x">
              {next7Days.map((date, index) => {
                const isSelected = selectedDayIndex === index;
                const scheduleDay = schedule[index];
                return (
                  <button
                    key={scheduleDay.dayOfWeek}
                    onClick={() => setSelectedDayIndex(index)}
                    className={cn(
                      "flex-shrink-0 snap-start flex flex-col items-center justify-center p-3 rounded-[26px] border-2 transition-all w-[88px]",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : scheduleDay.enabled
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
                          : "border-gray-100 hover:border-gray-200 bg-white text-gray-600",
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider mb-1">{format(date, "EEE")}</span>
                    <span className="text-[2rem] font-bold leading-none">{format(date, "d")}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-[1rem] text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Available Times
              </h3>

              <button
                type="button"
                onClick={resetSelectedDay}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear day
              </button>
            </div>

            <p className="text-sm text-gray-400 mt-2 mb-4">
              Click each 1-hour slot to mark when buyers are allowed to book this property.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {TIME_OPTIONS.map((time) => {
                const selected = hasSlot(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTimeSlot(time)}
                    className={cn(
                      "py-3 px-3 rounded-xl text-sm font-semibold transition-all border",
                      selected
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white border-gray-200 hover:border-primary text-gray-700 hover:text-primary",
                    )}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto flex flex-col gap-3">
          <div className="text-sm text-muted-foreground text-center">
            {selectedDay.enabled && selectedDay.slots.length > 0
              ? `${selectedDay.dayOfWeek}: ${selectedDay.slots.map((slot) => slot.start).join(", ")}`
              : `No time slot selected for ${selectedDay.dayOfWeek}.`}
          </div>

          <Button onClick={handleSave} className="w-full h-12 text-base font-bold">
            <Save className="w-4 h-4 mr-2" />
            Save Availability Settings
          </Button>
        </div>
      </div>
    </div>
  );
};


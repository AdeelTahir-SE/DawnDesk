import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  StickyNote,
} from "lucide-react";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  notebook_id: number | null;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  color: string;
  word_count: number;
  char_count: number;
  reading_time_minutes: number;
  is_daily_note: boolean;
  daily_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  notes: NoteItem[];
  onNoteSelect: (noteId: number) => void;
  onCreateDailyNote: (date: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function DailyNotesView({ notes, onNoteSelect, onCreateDailyNote }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(today));

  // Map of date → daily notes
  const dailyNotesMap = useMemo(() => {
    const map = new Map<string, NoteItem[]>();
    for (const note of notes) {
      if (note.is_daily_note && note.daily_date) {
        const key = note.daily_date.slice(0, 10);
        const existing = map.get(key) ?? [];
        existing.push(note);
        map.set(key, existing);
      }
    }
    return map;
  }, [notes]);

  // Calculate streak
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    // Check if today has a note; if not, start from yesterday
    if (!dailyNotesMap.has(formatDateKey(d))) {
      d.setDate(d.getDate() - 1);
    }
    while (dailyNotesMap.has(formatDateKey(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [dailyNotesMap]);

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{ date: Date; key: string; inMonth: boolean }> = [];

    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i);
      days.push({ date: d, key: formatDateKey(d), inMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      days.push({ date: d, key: formatDateKey(d), inMonth: true });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({ date: d, key: formatDateKey(d), inMonth: false });
    }

    return days;
  }, [currentMonth, currentYear]);

  const selectedDayNotes = dailyNotesMap.get(selectedDate) ?? [];
  const todayKey = formatDateKey(today);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayKey);
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
            Daily Journal
          </p>
          <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white">
            Daily Notes
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Track your thoughts day by day.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-lg font-black text-white">{streak}</span>
              <span className="text-sm text-white/50">day streak</span>
            </div>
          )}
          <button
            onClick={goToToday}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.8fr]">
        {/* Calendar Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
          {/* Month navigation */}
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold text-white">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={goToNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-white/40"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const hasNote = dailyNotesMap.has(day.key);
              const isToday = day.key === todayKey;
              const isSelected = day.key === selectedDate;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day.key)}
                  className={`
                    relative flex h-11 items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${!day.inMonth ? "text-white/15" : "text-white/70 hover:bg-neutral-800/60"}
                    ${isSelected ? "bg-yellow-400/15 text-yellow-400 ring-1 ring-yellow-400/30" : ""}
                    ${isToday && !isSelected ? "ring-1 ring-white/20" : ""}
                  `}
                >
                  {day.date.getDate()}
                  {hasNote && (
                    <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              {selectedDayNotes.length === 0 && (
                <button
                  onClick={() => onCreateDailyNote(selectedDate)}
                  className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-yellow-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create
                </button>
              )}
            </div>

            {selectedDayNotes.length > 0 ? (
              <div className="space-y-3">
                {selectedDayNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note.id)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:bg-neutral-900"
                  >
                    <p className="text-sm font-bold text-white">
                      {note.title || "Untitled"}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs text-white/50">
                      {stripHtml(note.content).slice(0, 200) || "No content"}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-white/30">
                      <span>{note.word_count} words</span>
                      <span>·</span>
                      <span>{note.reading_time_minutes} min read</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-12">
                <StickyNote className="mb-3 h-10 w-10 text-white/20" />
                <p className="text-sm font-semibold text-white/40">
                  No daily note for this date
                </p>
                <p className="mt-1 text-xs text-white/25">
                  Click "Create" to start journaling
                </p>
              </div>
            )}
          </div>

          {/* Stats card */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
            <h3 className="mb-4 text-sm font-bold text-white">Journal Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs font-semibold text-white/50">Total Days</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {dailyNotesMap.size}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs font-semibold text-white/50">This Month</p>
                <p className="mt-1 text-2xl font-black text-yellow-400">
                  {
                    Array.from(dailyNotesMap.keys()).filter((k) => {
                      const [y, m] = k.split("-").map(Number);
                      return y === currentYear && m === currentMonth + 1;
                    }).length
                  }
                </p>
              </div>
              <div className="col-span-2 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs font-semibold text-white/50">Current Streak</p>
                <div className="mt-1 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <p className="text-2xl font-black text-orange-400">{streak}</p>
                  <p className="text-sm text-white/40">consecutive days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

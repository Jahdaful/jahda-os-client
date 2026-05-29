/** Single source of truth for PWAL's daily schedule.
 *  Consumed by PlannerPage, PlannerPanel, ScheduleView — no more duplicates. */

export interface ScheduleSlot {
  label: string;
  start: number; // minutes since midnight
  end: number;
  icon: string;
  color: string;
  note: string;
}

export const WEEKDAY_SLOTS: ScheduleSlot[] = [
  { label: "Morning Devotion",  start:  5*60,       end:  7*60,       icon: "🌅", color: "#f59e0b", note: "Prayer & Scripture" },
  { label: "Prep & Commute",    start:  7*60,       end:  9*60,       icon: "🚗", color: "#6b7280", note: "Breakfast & readiness" },
  { label: "9-to-5 Employment", start:  9*60,       end: 17*60,       icon: "💼", color: "#3b82f6", note: "Focus & excellence" },
  { label: "Family Time",       start: 17*60,       end: 19*60,       icon: "🏡", color: "#f59e0b", note: "Dinner & presence" },
  { label: "Ministry Hour",     start: 19*60,       end: 20*60+30,    icon: "✝️", color: "#ff3333", note: "Pastoral duties" },
  { label: "Chef Studio",       start: 20*60+30,    end: 22*60,       icon: "👨‍🍳", color: "#00d4ff", note: "Culinary craft" },
  { label: "Design Atelier",    start: 22*60,       end: 23*60+30,    icon: "🤵", color: "#a855f7", note: "Fashion & creative" },
  { label: "Rest & Recovery",   start: 23*60+30,    end: 29*60,       icon: "😴", color: "#475569", note: "Restore & renew" },
];

export const WEEKEND_SLOTS: ScheduleSlot[] = [
  { label: "Morning Devotion",  start:  6*60,       end:  8*60,       icon: "🌅", color: "#f59e0b", note: "Extended prayer time" },
  { label: "Ministry Morning",  start:  8*60,       end: 13*60,       icon: "✝️", color: "#ff3333", note: "Church & pastoral" },
  { label: "Family Afternoon",  start: 13*60,       end: 16*60,       icon: "🏡", color: "#f59e0b", note: "Rest & togetherness" },
  { label: "Chef Studio",       start: 16*60,       end: 18*60,       icon: "👨‍🍳", color: "#00d4ff", note: "Weekend culinary" },
  { label: "Design Atelier",    start: 18*60,       end: 21*60,       icon: "🤵", color: "#a855f7", note: "Fashion projects" },
  { label: "Evening Wind-Down", start: 21*60,       end: 29*60,       icon: "😴", color: "#475569", note: "Rest" },
];

/** Returns the active slot for a given time-of-day in minutes. */
export function getActiveSlot(minuteOfDay: number, isWorkDay: boolean): ScheduleSlot | undefined {
  const slots = isWorkDay ? WEEKDAY_SLOTS : WEEKEND_SLOTS;
  return slots.find((s) => minuteOfDay >= s.start && minuteOfDay < s.end);
}

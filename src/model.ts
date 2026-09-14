export type Plan = { id: string; title: string; start: string; end: string; location: string; notes: string; url?: string; };
export function validatePlan(p: Plan) {
 if (!p.id || !p.title.trim()) throw new Error('Give your plan a title.');
 if (!Number.isFinite(Date.parse(p.start)) || !Number.isFinite(Date.parse(p.end))) throw new Error('Choose a valid date and time.');
 if (Date.parse(p.end) <= Date.parse(p.start)) throw new Error('The end must be after the start.');
}
export function marker(p: Plan) { return `[My Vibe:${encodeURIComponent(p.id)}]`; }
export type EventRef = { id: string; calendarId: string; notes?: string | null };
export type CalendarPort = {
 getLinked: (id: string) => Promise<EventRef | null>;
 find: (calendarId: string, plan: Plan) => Promise<EventRef[]>;
 create: (calendarId: string, plan: Plan, notes: string) => Promise<string>;
};
// A single operation per source item protects against simultaneous taps on different screens.
export function makeCalendarWriter(port: CalendarPort, saveLink: (planId: string, eventId: string) => Promise<void>) {
 const pending = new Map<string, Promise<string>>();
 return (plan: Plan, calendarId: string, linkedId?: string): Promise<string> => {
  const existing = pending.get(plan.id); if(existing) return existing;
  const operation = (async () => {
   validatePlan(plan);
   if (linkedId) {
    const linked = await port.getLinked(linkedId);
    if(linked) return linked.id;
   }
   const matches = await port.find(calendarId, plan);
   const found = matches.find(e => e.notes?.includes(marker(plan)));
   const id = found?.id ?? await port.create(calendarId, plan, [plan.notes, plan.url, marker(plan)].filter(Boolean).join('\n\n'));
   // If persistence fails, the marker allows the next attempt to recover the already-created event.
   await saveLink(plan.id, id);
   return id;
  })().finally(() => pending.delete(plan.id));
  pending.set(plan.id, operation); return operation;
 };
}

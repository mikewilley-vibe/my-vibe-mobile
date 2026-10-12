/**
 * Offline copy of the school-year and holiday links.
 * The live list comes from my-vibe-app `lib/familyCalendars.ts` via `/api/family-calendars`.
 * Update that file when a new school year or holiday year is published.
 */
export const FAMILY_CALENDAR_CONFIG = {
  schoolYearLabel: '2026–2027',
  holidayYear: 2026,
  schools: {
    nps: {
      name: 'Norfolk Public Schools',
      href: 'https://resources.finalsite.net/images/v1787158396/npsk12vaus/rm1zlur7d3n0ulsey5rg/Academic_Calendar_26_27_1.pdf',
    },
    rps: {
      name: 'Richmond Public Schools',
      href: 'https://resources.finalsite.net/images/v1769534873/rvaschoolsnet/vgnamrglqdi6bnu5lq8j/2026-27RPSCalendar.pdf',
    },
    orchardHouse: {
      name: 'Orchard House',
      href: 'https://www.orchardhouse.org/school-events',
    },
  },
} as const;

export type FamilyCalendarLink = {
  id: string;
  label: string;
  href: string;
  detail: string;
};

export function familyCalendarLinks(
  config: typeof FAMILY_CALENDAR_CONFIG = FAMILY_CALENDAR_CONFIG,
): FamilyCalendarLink[] {
  const { schoolYearLabel, holidayYear, schools } = config;
  return [
    {
      id: 'nps',
      label: `${schools.nps.name} ${schoolYearLabel} academic calendar`,
      href: schools.nps.href,
      detail: 'Official Norfolk Public Schools calendar',
    },
    {
      id: 'rps',
      label: `${schools.rps.name} ${schoolYearLabel} academic calendar`,
      href: schools.rps.href,
      detail: 'Official Richmond Public Schools calendar',
    },
    {
      id: 'orchard-house',
      label: `${schools.orchardHouse.name} ${schoolYearLabel} school calendar`,
      href: schools.orchardHouse.href,
      detail: 'Official Orchard House Middle School calendar',
    },
    {
      id: 'federal',
      label: `US federal holidays ${holidayYear}`,
      href: `https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/?year=${holidayYear}`,
      detail: 'Official list from the U.S. Office of Personnel Management',
    },
    {
      id: 'virginia',
      label: `Virginia state holidays ${holidayYear}`,
      href: `https://www.dhrm.virginia.gov/docs/default-source/default-document-library/${holidayYear}-pay-and-holiday-calendar.pdf`,
      detail: 'Official list from the Virginia Department of Human Resource Management',
    },
  ];
}

export function parseFamilyCalendarLinks(body: unknown): FamilyCalendarLink[] | null {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { links?: unknown }).links)) return null;
  const links: FamilyCalendarLink[] = [];
  for (const item of (body as { links: unknown[] }).links) {
    if (!item || typeof item !== 'object') return null;
    const link = item as { id?: unknown; label?: unknown; href?: unknown; detail?: unknown };
    if (typeof link.id !== 'string' || typeof link.label !== 'string' || typeof link.href !== 'string') return null;
    if (!/^https:\/\//i.test(link.href)) return null;
    links.push({
      id: link.id,
      label: link.label,
      href: link.href,
      detail: typeof link.detail === 'string' ? link.detail : '',
    });
  }
  const ids = new Set(links.map(link => link.id));
  if (!['nps', 'rps', 'orchard-house', 'federal', 'virginia'].every(id => ids.has(id))) return null;
  return links;
}

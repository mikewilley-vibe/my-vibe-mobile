export type ProjectCategory =
  | 'mobile'
  | 'web-app'
  | 'website'
  | 'ai'
  | 'business'
  | 'experiment';

export type ProjectStatus = 'live' | 'in-progress' | 'experiment';

export type Project = {
  id: string;
  name: string;
  shortDescription: string;
  category: ProjectCategory;
  status: ProjectStatus;
  technologies: string[];
  icon: string;
  longDescription?: string;
  website?: string;
  appLink?: string;
  /** Public repositories only. */
  github?: string;
  appStore?: string;
};

export const PROJECT_CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: 'mobile', label: 'Mobile Apps' },
  { id: 'web-app', label: 'Web Apps' },
  { id: 'website', label: 'Websites' },
  { id: 'ai', label: 'AI Projects' },
  { id: 'business', label: 'Business/Client Work' },
  { id: 'experiment', label: 'Experiments' },
];

export function categoryLabel(id: ProjectCategory): string {
  return PROJECT_CATEGORIES.find(item => item.id === id)?.label ?? id;
}

export function statusLabel(status: ProjectStatus): string {
  if (status === 'live') return 'Live';
  if (status === 'in-progress') return 'In progress';
  return 'Experiment';
}

/**
 * Starter portfolio. Add a project by appending an object — name, description,
 * category, icon, status, technologies, and any public links. Never add private GitHub URLs.
 */
export const PROJECTS: Project[] = [
  {
    id: 'sweatshift',
    name: 'SweatShift',
    shortDescription: 'HIIT workout timer.',
    category: 'mobile',
    status: 'live',
    technologies: ['React Native', 'Expo', 'TypeScript'],
    icon: '⏱',
    longDescription: 'On-device interval timer. A public HTTP API is not available yet; My Vibe is ready to show workouts on the calendar when SweatShift exposes one.',
    github: 'https://github.com/mikewilley-vibe/workout-timer-mobile',
  },
  {
    id: 'showsignal',
    name: 'ShowSignal',
    shortDescription: 'Concert finder for Hampton Roads, Richmond, and DC.',
    category: 'web-app',
    status: 'live',
    technologies: ['Next.js', 'Ticketmaster API', 'TypeScript'],
    icon: '♫',
    website: 'https://concert-finder-eta.vercel.app',
    github: 'https://github.com/mikewilley-vibe/concert-finder',
  },
  {
    id: 'my-vibe',
    name: 'My Vibe',
    shortDescription: 'Personal hub for plans, family calendar, shows, and UVA sports.',
    category: 'mobile',
    status: 'live',
    technologies: ['React Native', 'Expo', 'TypeScript'],
    icon: '⌂',
    github: 'https://github.com/mikewilley-vibe/my-vibe-mobile',
  },
  {
    id: 'hapshere',
    name: 'HapsHere',
    shortDescription: 'Local buzz companion app.',
    category: 'mobile',
    status: 'in-progress',
    technologies: ['Expo', 'React Native'],
    icon: '📍',
    longDescription: 'Listed as an ecosystem app. A public launch URL is not stored in this repo — set EXPO_PUBLIC_HAPSHERE_URL when it should open from My Apps. Private GitHub is not linked.',
  },
];

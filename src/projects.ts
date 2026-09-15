export type ProjectType =
  | 'website'
  | 'ios-app'
  | 'web-app'
  | 'experiment'
  | 'ai'
  | 'business';

/** Older catalog name. `mobile` maps to iOS App. */
export type ProjectCategory = ProjectType | 'mobile';

export type ProjectStatus = 'live' | 'in-development' | 'archived';

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus | 'in-progress' | 'experiment';
  /** Preferred blurb. `shortDescription` is still read if this is omitted. */
  description?: string;
  /** Preferred type. `category` (including `mobile`) is still read if this is omitted. */
  type?: ProjectType;
  url?: string;
  githubUrl?: string;
  appStoreUrl?: string;
  image?: string;
  icon?: string;
  technologies?: string[];
  longDescription?: string;
  appLink?: string;
  /** Aliases kept so older catalog entries and docs still work. */
  shortDescription?: string;
  category?: ProjectCategory;
  website?: string;
  github?: string;
  appStore?: string;
};

export const PROJECT_TYPES: { id: ProjectType; label: string }[] = [
  { id: 'ios-app', label: 'iOS Apps' },
  { id: 'web-app', label: 'Web Apps' },
  { id: 'website', label: 'Websites' },
  { id: 'ai', label: 'AI Projects' },
  { id: 'business', label: 'Business/Client Work' },
  { id: 'experiment', label: 'Experiments' },
];

/** Alias of PROJECT_TYPES for existing imports. */
export const PROJECT_CATEGORIES = PROJECT_TYPES;

export function projectDescription(project: Project): string {
  return project.description || project.shortDescription || '';
}

export function projectType(project: Project): ProjectType {
  if (project.type) return project.type;
  if (project.category === 'mobile') return 'ios-app';
  if (project.category) return project.category;
  return 'experiment';
}

export function projectUrl(project: Project): string | undefined {
  return project.url || project.website;
}

export function projectGithubUrl(project: Project): string | undefined {
  return project.githubUrl || project.github;
}

export function projectAppStoreUrl(project: Project): string | undefined {
  return project.appStoreUrl || project.appStore;
}

export function typeLabel(type: ProjectType | ProjectCategory): string {
  if (type === 'mobile') return 'iOS Apps';
  return PROJECT_TYPES.find(item => item.id === type)?.label ?? type;
}

/** @deprecated Use typeLabel. */
export function categoryLabel(id: ProjectType | ProjectCategory): string {
  return typeLabel(id);
}

export function statusLabel(status: ProjectStatus | 'in-progress' | 'experiment'): string {
  if (status === 'live') return 'Live';
  if (status === 'archived') return 'Archived';
  return 'In Development';
}

/**
 * Starter portfolio. Add a project by appending an object to PROJECTS:
 *   { name, description, type, status, url?, githubUrl?, appStoreUrl?, image? }
 *
 * Types: Website, iOS App, Web App, Experiment, AI, Business.
 * Status: Live | In Development | Archived.
 *
 * Only add public URLs that already exist in this repo (or are otherwise known
 * here). Leave url / githubUrl / appStoreUrl omitted until a real link is available.
 * Never add private GitHub URLs.
 *
 * Compatibility aliases: shortDescription, category, website, github, appStore.
 * Concert Finder is the former name of ShowSignal — do not add a second card.
 */
export const PROJECTS: Project[] = [
  {
    id: 'sweatshift',
    name: 'SweatShift',
    description: 'HIIT workout timer.',
    type: 'ios-app',
    status: 'live',
    technologies: ['React Native', 'Expo', 'TypeScript'],
    icon: '⏱',
    longDescription: 'On-device interval timer. A public HTTP API is not available yet; My Vibe is ready to show workouts on the calendar when SweatShift exposes one.',
    githubUrl: 'https://github.com/mikewilley-vibe/workout-timer-mobile',
  },
  {
    id: 'showsignal',
    name: 'ShowSignal',
    description: 'Concert finder for Hampton Roads, Richmond, and DC. Formerly Concert Finder.',
    type: 'web-app',
    status: 'live',
    technologies: ['Next.js', 'Ticketmaster API', 'TypeScript'],
    icon: '♫',
    url: 'https://concert-finder-eta.vercel.app',
    githubUrl: 'https://github.com/mikewilley-vibe/concert-finder',
  },
  {
    id: 'my-vibe',
    name: 'My Vibe',
    description: 'Personal hub for plans, family calendar, shows, and UVA sports.',
    type: 'ios-app',
    status: 'live',
    technologies: ['React Native', 'Expo', 'TypeScript'],
    icon: '⌂',
    githubUrl: 'https://github.com/mikewilley-vibe/my-vibe-mobile',
  },
  {
    id: 'hapshere',
    name: 'HapsHere',
    description: 'Local buzz companion app.',
    type: 'ios-app',
    status: 'in-development',
    technologies: ['Expo', 'React Native'],
    icon: '📍',
    longDescription: 'Listed as an ecosystem app. A public launch URL is not stored in this repo — set EXPO_PUBLIC_HAPSHERE_URL when it should open from the card. Private GitHub is not linked.',
  },
  {
    id: 'vibe-school',
    name: 'Vibe School / Teach Me to Vibe Code',
    description: 'Teaching and learning vibe coding.',
    type: 'experiment',
    status: 'in-development',
    icon: '🎓',
  },
  {
    id: 'vandy-accounting',
    name: 'Vandy Accounting Solutions',
    description: 'Accounting solutions work.',
    type: 'business',
    status: 'in-development',
    icon: '📒',
  },
  {
    id: 'skoshie-shelties',
    name: 'Skoshie Shelties',
    description: 'Sheltie-related project.',
    type: 'website',
    status: 'in-development',
    icon: '🐕',
  },
  {
    id: 'adale-martin',
    name: 'Adale Martin website',
    description: 'Personal website for Adale Martin.',
    type: 'website',
    status: 'in-development',
    icon: '✦',
  },
  {
    id: 'orf-rock',
    name: 'Orf Rock',
    description: 'Orf Rock project.',
    type: 'experiment',
    status: 'in-development',
    icon: '🎸',
  },
];

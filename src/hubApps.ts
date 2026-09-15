export type HubAppId = 'showsignal' | 'sweatshift' | 'hapshere';

export type HubApp = {
  id: HubAppId;
  name: string;
  blurb: string;
  /** https URL when known. Prefer env so missing production URLs stay explicit. */
  url?: string;
  /** Custom URL scheme, without :// */
  scheme?: string;
  /** Env var that supplies a missing https URL. */
  urlEnv?: string;
  urlNeeded: boolean;
};

function envUrl(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (value && /^https?:\/\//i.test(value)) return value.replace(/\/$/, '');
  return undefined;
}

function envScheme(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  return value.replace(/:\/\/$/, '');
}

/**
 * Ecosystem apps linked from My Projects cards — not a separate Home strip.
 * Add an app by appending to this list. Do not invent production URLs.
 */
export function hubApps(): HubApp[] {
  const hapshereUrl = envUrl('EXPO_PUBLIC_HAPSHERE_URL');
  const hapshereScheme = envScheme('EXPO_PUBLIC_HAPSHERE_SCHEME');
  const sweatshiftUrl = envUrl('EXPO_PUBLIC_SWEATSHIFT_URL');
  const showSignalUrl = envUrl('EXPO_PUBLIC_SHOWSIGNAL_API_BASE_URL') || 'https://concert-finder-eta.vercel.app';
  return [
    {
      id: 'showsignal',
      name: 'ShowSignal',
      blurb: 'Local concerts and tickets.',
      url: showSignalUrl,
      scheme: 'showsignal',
      urlNeeded: false,
    },
    {
      id: 'sweatshift',
      name: 'SweatShift',
      blurb: 'HIIT workout timer. Independent Expo app.',
      url: sweatshiftUrl,
      scheme: envScheme('EXPO_PUBLIC_SWEATSHIFT_SCHEME') || 'workouttimermobile',
      urlEnv: 'EXPO_PUBLIC_SWEATSHIFT_URL',
      urlNeeded: !sweatshiftUrl,
    },
    {
      id: 'hapshere',
      name: 'HapsHere',
      blurb: 'Local buzz. URL is not configured in this repo yet.',
      url: hapshereUrl,
      scheme: hapshereScheme,
      urlEnv: 'EXPO_PUBLIC_HAPSHERE_URL',
      urlNeeded: !hapshereUrl && !hapshereScheme,
    },
  ];
}

export function hubAppOpenTarget(app: HubApp): { kind: 'scheme' | 'https'; value: string } | { kind: 'missing'; env?: string } {
  if (app.scheme) return { kind: 'scheme', value: `${app.scheme}://` };
  if (app.url) return { kind: 'https', value: app.url };
  return { kind: 'missing', env: app.urlEnv };
}

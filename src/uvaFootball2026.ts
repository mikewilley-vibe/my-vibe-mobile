import type { UvaGame } from './uva.ts';

/**
 * Full 2026 Virginia football regular season.
 *
 * Verified 2026-10-12 against ESPN's Virginia schedule (team 258), which matches
 * the official scores and kickoffs published by Virginia athletics:
 * https://virginiasports.com/sports/football/schedule
 * Played games: W 34-8, W 59-3, L 27-38, W 42-3, L 7-38, W 28-25.
 * A midnight Eastern timestamp means the kickoff is still TBA.
 * Score strings are UVA points, then the opponent.
 */
export const UVA_FOOTBALL_2026_SOURCE = 'https://virginiasports.com/sports/football/schedule';

const SOURCE = UVA_FOOTBALL_2026_SOURCE;

export const UVA_FOOTBALL_2026: readonly UvaGame[] = [
  {
    id: 'uva-fb-2026-ncst',
    opponent: 'NC State',
    date: '2026-08-29T19:30:00.000Z',
    location: 'home',
    result: 'win',
    score: '34-8',
    network: 'ESPN',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-nsu',
    opponent: 'Norfolk State',
    date: '2026-09-11T23:00:00.000Z',
    location: 'home',
    result: 'win',
    score: '59-3',
    network: 'ACCNX',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-wvu',
    opponent: 'West Virginia',
    date: '2026-09-19T23:30:00.000Z',
    location: 'neutral',
    result: 'loss',
    score: '27-38',
    network: 'ACCN',
    venue: 'Bank of America Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-udel',
    opponent: 'Delaware',
    date: '2026-09-26T22:00:00.000Z',
    location: 'home',
    result: 'win',
    score: '42-3',
    status: 'final',
    network: 'ACCN',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-fsu',
    opponent: 'Florida State',
    date: '2026-10-03T19:30:00.000Z',
    location: 'away',
    result: 'loss',
    score: '7-38',
    status: 'final',
    network: 'ESPN2',
    venue: 'Doak Campbell Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-syr',
    opponent: 'Syracuse',
    date: '2026-10-10T23:30:00.000Z',
    location: 'home',
    result: 'win',
    score: '28-25',
    status: 'final',
    network: 'ACCN',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-smu',
    opponent: 'SMU',
    date: '2026-10-17T16:00:00.000Z',
    location: 'away',
    network: 'CW',
    venue: 'Gerald J. Ford Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-duke',
    opponent: 'Duke',
    date: '2026-10-23T23:00:00.000Z',
    location: 'home',
    network: 'ESPN',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-wake',
    opponent: 'Wake Forest',
    date: '2026-10-31T04:00:00.000Z',
    location: 'away',
    venue: 'Winston-Salem, N.C.',
    sport: 'football',
    sourceUrl: SOURCE,
    timeUnknown: true,
  },
  {
    id: 'uva-fb-2026-cal',
    opponent: 'Cal',
    date: '2026-11-14T05:00:00.000Z',
    location: 'home',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
    timeUnknown: true,
  },
  {
    id: 'uva-fb-2026-unc',
    opponent: 'North Carolina',
    date: '2026-11-21T05:00:00.000Z',
    location: 'home',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
    timeUnknown: true,
  },
  {
    id: 'uva-fb-2026-vt',
    opponent: 'Virginia Tech',
    date: '2026-11-28T05:00:00.000Z',
    location: 'away',
    venue: 'Blacksburg, Va.',
    sport: 'football',
    sourceUrl: SOURCE,
    timeUnknown: true,
  },
];

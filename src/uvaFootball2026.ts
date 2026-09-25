import type { UvaGame } from './uva.ts';

/**
 * Full 2026 Virginia football regular season.
 *
 * Verified 2026-09-25 against the official schedule:
 * https://virginiasports.com/sports/football/schedule
 * Kickoff times and TV also checked against Virginia's Sept. 26, 2026 game notes:
 * https://static.virginiasports.com/custompages/sports/m-footbl/gamenotes/2026/092626-DELGameNotes.pdf
 * Final scores for the three played games match that schedule page (W 34-8, W 59-3, L 27-38)
 * and the season stats PDF (120 points for, 49 against):
 * https://static.virginiasports.com/custompages/sports/m-footbl/stats/2026-2027/seasonstats.pdf
 *
 * Dates are America/New_York. A midnight Eastern timestamp means the kickoff is still TBA.
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
    network: 'ESPN2 or ACCN',
    venue: 'Tallahassee, Fla.',
    sport: 'football',
    sourceUrl: SOURCE,
  },
  {
    id: 'uva-fb-2026-syr',
    opponent: 'Syracuse',
    date: '2026-10-10T04:00:00.000Z',
    location: 'home',
    venue: 'Scott Stadium',
    sport: 'football',
    sourceUrl: SOURCE,
    timeUnknown: true,
  },
  {
    id: 'uva-fb-2026-smu',
    opponent: 'SMU',
    date: '2026-10-17T04:00:00.000Z',
    location: 'away',
    venue: 'Dallas, Texas',
    sport: 'football',
    sourceUrl: SOURCE,
    timeUnknown: true,
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

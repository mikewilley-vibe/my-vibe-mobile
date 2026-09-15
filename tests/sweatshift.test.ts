import test from 'node:test';
import assert from 'node:assert/strict';
import { getSweatShiftWorkouts, parseSweatShiftWorkouts, SWEATSHIFT_API_BASE, SWEATSHIFT_CONTRACT } from '../src/sweatshift.ts';

test('SweatShift contract is documented and not treated as a live URL', () => {
  assert.equal(SWEATSHIFT_CONTRACT.list, 'GET /workouts');
  assert.equal(SWEATSHIFT_API_BASE, '');
});

test('unconfigured SweatShift client returns a stub, not fake workouts', async () => {
  const result = await getSweatShiftWorkouts();
  assert.equal(result.status, 'unconfigured');
  assert.deepEqual(result.workouts, []);
  assert.match(result.message, /no public API/i);
});

test('parser accepts the documented workout shape and drops junk', () => {
  const workouts = parseSweatShiftWorkouts({
    workouts: [
      { id: '1', title: 'HIIT', startsAt: '2026-09-19T12:00:00.000Z', endsAt: '2026-09-19T13:00:00.000Z' },
      { id: 'bad', title: 'Nope' },
      null,
    ],
  });
  assert.equal(workouts.length, 1);
  assert.equal(workouts[0].title, 'HIIT');
});

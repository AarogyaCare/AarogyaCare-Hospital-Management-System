/**
 * Comprehensive Unit Tests for calculatePatientAge
 * Tests:
 * 1. Exact birthday anniversary today
 * 2. Birthday yet to occur this calendar year
 * 3. Birthday already passed this calendar year
 * 4. Leap-year birthday (Feb 29) on leap and non-leap years
 * 5. Infant boundary tests (< 1 month -> days, < 1 year -> months/days, 1-2 years)
 * 6. Edge cases: Missing DOB, invalid string, future dates
 */

declare const process: any;

import { calculatePatientAge } from './age.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runAgeUnitTests() {
  console.log('Running calculatePatientAge unit tests...');

  // Fixed reference date: 2026-10-20
  const refDate = new Date('2026-10-20T00:00:00');

  // Test 1: Birthday occurred earlier this year (born 1990-05-15)
  const res1 = calculatePatientAge('1990-05-15', refDate);
  assert(res1.isValid === true, 'res1 should be valid');
  assert(res1.years === 36, `Expected 36 years, got ${res1.years}`);
  assert(res1.formattedAge === '36 yrs', `Expected "36 yrs", got ${res1.formattedAge}`);
  assert(res1.isInfant === false, 'Should not be infant');

  // Test 2: Birthday yet to occur this year (born 1990-12-25)
  const res2 = calculatePatientAge('1990-12-25', refDate);
  assert(res2.isValid === true, 'res2 should be valid');
  assert(res2.years === 35, `Expected 35 years (not reached Dec 25 yet), got ${res2.years}`);
  assert(res2.formattedAge === '35 yrs', `Expected "35 yrs", got ${res2.formattedAge}`);

  // Test 3: Birthday is today (born 1985-10-20)
  const res3 = calculatePatientAge('1985-10-20', refDate);
  assert(res3.isValid === true, 'res3 should be valid');
  assert(res3.years === 41, `Expected 41 years on birthday, got ${res3.years}`);
  assert(res3.formattedAge === '41 yrs', `Expected "41 yrs", got ${res3.formattedAge}`);

  // Test 4: Birthday tomorrow (born 1985-10-21)
  const res4 = calculatePatientAge('1985-10-21', refDate);
  assert(res4.isValid === true, 'res4 should be valid');
  assert(res4.years === 40, `Expected 40 years before birthday, got ${res4.years}`);

  // Test 5: Leap-year birthday (born 2020-02-29, test in non-leap year 2025-02-28 and 2025-03-01)
  const leapRefBefore = new Date('2025-02-28T00:00:00');
  const leapResBefore = calculatePatientAge('2020-02-29', leapRefBefore);
  assert(leapResBefore.years === 4, `Expected 4 years on Feb 28, got ${leapResBefore.years}`);

  const leapRefAfter = new Date('2025-03-01T00:00:00');
  const leapResAfter = calculatePatientAge('2020-02-29', leapRefAfter);
  assert(leapResAfter.years === 5, `Expected 5 years on Mar 1, got ${leapResAfter.years}`);

  // Test 6: Infant < 1 month (born 2026-10-08, ref 2026-10-20 => 12 days)
  const infantDays = calculatePatientAge('2026-10-08', refDate);
  assert(infantDays.isValid === true, 'infantDays should be valid');
  assert(infantDays.years === 0, 'infantDays years should be 0');
  assert(infantDays.isInfant === true, 'Should be infant');
  assert(infantDays.days === 12, `Expected 12 days, got ${infantDays.days}`);
  assert(infantDays.formattedAge === '12 days', `Expected "12 days", got ${infantDays.formattedAge}`);

  // Test 7: Infant 5 months (born 2026-05-20, ref 2026-10-20 => 5 months)
  const infantMonths = calculatePatientAge('2026-05-20', refDate);
  assert(infantMonths.isValid === true, 'infantMonths should be valid');
  assert(infantMonths.years === 0, 'infantMonths years should be 0');
  assert(infantMonths.months === 5, `Expected 5 months, got ${infantMonths.months}`);
  assert(infantMonths.formattedAge === '5 mo', `Expected "5 mo", got ${infantMonths.formattedAge}`);

  // Test 8: Toddler 1 year 3 months (born 2025-07-20, ref 2026-10-20 => 1 yr 3 mo)
  const toddler = calculatePatientAge('2025-07-20', refDate);
  assert(toddler.years === 1, `Expected 1 year, got ${toddler.years}`);
  assert(toddler.months === 3, `Expected 3 months, got ${toddler.months}`);
  assert(toddler.formattedAge === '1 yr 3 mo', `Expected "1 yr 3 mo", got ${toddler.formattedAge}`);

  // Test 9: Future date (born 2026-11-01, ref 2026-10-20)
  const future = calculatePatientAge('2026-11-01', refDate);
  assert(future.isValid === false, 'Future date should be invalid');
  assert(future.error === 'Date of birth cannot be in the future', `Expected future error, got ${future.error}`);

  // Test 10: Invalid string
  const invalid = calculatePatientAge('invalid-date-string', refDate);
  assert(invalid.isValid === false, 'Invalid string should not be valid');
  assert(invalid.error === 'Invalid date format', `Expected invalid format error, got ${invalid.error}`);

  // Test 11: Missing / null / undefined
  const empty = calculatePatientAge('', refDate);
  assert(empty.isValid === false, 'Empty DOB should not be valid');
  assert(empty.error === 'Date of birth is required', `Expected missing error, got ${empty.error}`);

  const nullDob = calculatePatientAge(null, refDate);
  assert(nullDob.isValid === false, 'Null DOB should not be valid');

  console.log('ALL 11 AGE CALCULATION UNIT TESTS PASSED SUCCESSFULLY!');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('age.test')) {
  runAgeUnitTests();
}

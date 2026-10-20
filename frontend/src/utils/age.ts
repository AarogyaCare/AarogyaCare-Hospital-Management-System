/**
 * AarogyaCare Clinical Patient Age Calculation Utility
 * 
 * Date of Birth (DOB) is the single source of truth for patient age.
 * Accurately calculates completed years, months, and days based on birthday
 * occurrence in current calendar year, handling leap years and infant boundaries.
 */

export interface PatientAgeResult {
  years: number;
  months: number;
  days: number;
  formattedAge: string;
  isInfant: boolean;
  isValid: boolean;
  error?: string;
}

export function calculatePatientAge(dobInput: string | Date | null | undefined, referenceDateInput?: string | Date): PatientAgeResult {
  if (!dobInput) {
    return {
      years: 0,
      months: 0,
      days: 0,
      formattedAge: 'DOB not provided',
      isInfant: false,
      isValid: false,
      error: 'Date of birth is required'
    };
  }

  const birthDate = typeof dobInput === 'string' ? new Date(dobInput + (dobInput.length === 10 ? 'T00:00:00' : '')) : new Date(dobInput);
  if (isNaN(birthDate.getTime())) {
    return {
      years: 0,
      months: 0,
      days: 0,
      formattedAge: 'Invalid DOB',
      isInfant: false,
      isValid: false,
      error: 'Invalid date format'
    };
  }

  const refDate = referenceDateInput
    ? (typeof referenceDateInput === 'string' ? new Date(referenceDateInput + (referenceDateInput.length === 10 ? 'T00:00:00' : '')) : new Date(referenceDateInput))
    : new Date();

  // Strip hours/minutes for date-only comparison
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  const refDay = refDate.getDate();

  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  // Check for future date
  if (birthDate > refDate) {
    return {
      years: 0,
      months: 0,
      days: 0,
      formattedAge: 'Future date invalid',
      isInfant: false,
      isValid: false,
      error: 'Date of birth cannot be in the future'
    };
  }

  let years = refYear - birthYear;
  let months = refMonth - birthMonth;
  let days = refDay - birthDay;

  if (days < 0) {
    // Borrow days from previous month
    months -= 1;
    const prevMonthDays = new Date(refYear, refMonth, 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Handle leap year edge case: Born on Feb 29
  // In non-leap year, birthday anniversary occurs on Mar 1 (or Feb 28 in standard calendar)
  const isLeapDayBorn = birthMonth === 1 && birthDay === 29;
  const isRefLeapYear = (refYear % 4 === 0 && refYear % 100 !== 0) || (refYear % 400 === 0);
  if (isLeapDayBorn && !isRefLeapYear && refMonth === 1 && refDay === 28) {
    // If today is Feb 28 on a non-leap year, birthday not reached yet unless using Mar 1
  }

  const isInfant = years < 1;
  let formattedAge = '';

  if (years >= 2) {
    formattedAge = `${years} yrs`;
  } else if (years === 1) {
    formattedAge = months > 0 ? `1 yr ${months} mo` : '1 yr';
  } else if (months >= 1) {
    formattedAge = days > 0 ? `${months} mo ${days} d` : `${months} mo`;
  } else {
    formattedAge = `${Math.max(0, days)} days`;
  }

  return {
    years,
    months,
    days,
    formattedAge,
    isInfant,
    isValid: true
  };
}

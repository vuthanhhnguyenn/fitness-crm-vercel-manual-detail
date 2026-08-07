import { differenceInYears, parseISO } from 'date-fns';

/**
 * Calculate age from a date-of-birth string (YYYY-MM-DD).
 */
export function calcAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth));
}

/**
 * Return the minimum allowed age for a given brand.
 * FIT365 → 16, JOYFIT → 15
 */
export function getMinAge(brand: 'FIT365' | 'JOYFIT'): number {
  return brand === 'FIT365' ? 16 : 15;
}

/**
 * Returns true if the given age is considered a minor (under 20).
 */
export function isMinor(age: number): boolean {
  return age < 20;
}

/**
 * Returns true if the given age is below the brand's minimum required age.
 */
export function isBelowMinAge(age: number, brand: 'FIT365' | 'JOYFIT'): boolean {
  return age < getMinAge(brand);
}

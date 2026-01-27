import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatDateShort, formatPoints } from '../utils';

describe('cn (className merger)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle array of classes', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle object notation', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe('foo baz');
  });

  it('should return empty string when no classes provided', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

describe('formatDate', () => {
  it('should format a Date object with Russian locale by default', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    // Russian locale format: "15 марта 2024 г."
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should format a string date', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should support custom locale', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date, 'en-US');
    // US format: "March 15, 2024"
    expect(result).toContain('March');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should handle ISO date strings', () => {
    const result = formatDate('2024-12-25T10:30:00Z');
    expect(result).toContain('25');
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('should format a Date object to YYYY-MM-DD', () => {
    const date = new Date('2024-03-15T10:30:00Z');
    const result = formatDateShort(date);
    expect(result).toBe('2024-03-15');
  });

  it('should format a string date to YYYY-MM-DD', () => {
    const result = formatDateShort('2024-03-15T10:30:00Z');
    expect(result).toBe('2024-03-15');
  });

  it('should handle dates with different timezones', () => {
    const date = new Date('2024-12-31T23:59:59Z');
    const result = formatDateShort(date);
    expect(result).toBe('2024-12-31');
  });
});

describe('formatPoints', () => {
  it('should format positive points with a plus sign', () => {
    expect(formatPoints(10)).toBe('+10');
    expect(formatPoints(1)).toBe('+1');
    expect(formatPoints(100)).toBe('+100');
  });

  it('should format negative points with a minus sign', () => {
    expect(formatPoints(-10)).toBe('-10');
    expect(formatPoints(-1)).toBe('-1');
    expect(formatPoints(-100)).toBe('-100');
  });

  it('should format zero with a plus sign', () => {
    expect(formatPoints(0)).toBe('+0');
  });

  it('should handle large numbers', () => {
    expect(formatPoints(1000000)).toBe('+1000000');
    expect(formatPoints(-1000000)).toBe('-1000000');
  });
});

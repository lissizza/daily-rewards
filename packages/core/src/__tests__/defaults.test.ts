import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_REWARD_TYPES,
  DEFAULT_DEDUCTION_TYPES,
  getDefaultEventTypes,
} from '../utils/defaults';

describe('DEFAULT_REWARD_TYPES', () => {
  it('should export an array of reward types', () => {
    expect(Array.isArray(DEFAULT_REWARD_TYPES)).toBe(true);
    expect(DEFAULT_REWARD_TYPES.length).toBeGreaterThan(0);
  });

  it('should have all required properties for each reward type', () => {
    DEFAULT_REWARD_TYPES.forEach((type) => {
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('defaultPoints');
      expect(type).toHaveProperty('isDeduction');
      expect(type).toHaveProperty('isSystem');
      expect(type).toHaveProperty('icon');
      expect(type).toHaveProperty('order');
    });
  });

  it('should have isDeduction set to false for all reward types', () => {
    DEFAULT_REWARD_TYPES.forEach((type) => {
      expect(type.isDeduction).toBe(false);
    });
  });

  it('should have isSystem set to true for all reward types', () => {
    DEFAULT_REWARD_TYPES.forEach((type) => {
      expect(type.isSystem).toBe(true);
    });
  });

  it('should have non-negative defaultPoints for all reward types', () => {
    DEFAULT_REWARD_TYPES.forEach((type) => {
      expect(type.defaultPoints).toBeGreaterThanOrEqual(0);
    });
  });

  it('should contain expected reward types', () => {
    const names = DEFAULT_REWARD_TYPES.map((type) => type.name);
    expect(names).toContain('Посещение школы');
    expect(names).toContain('Хорошая оценка');
    expect(names).toContain('Бонус');
  });
});

describe('DEFAULT_DEDUCTION_TYPES', () => {
  it('should export an array of deduction types', () => {
    expect(Array.isArray(DEFAULT_DEDUCTION_TYPES)).toBe(true);
    expect(DEFAULT_DEDUCTION_TYPES.length).toBeGreaterThan(0);
  });

  it('should have all required properties for each deduction type', () => {
    DEFAULT_DEDUCTION_TYPES.forEach((type) => {
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('defaultPoints');
      expect(type).toHaveProperty('isDeduction');
      expect(type).toHaveProperty('isSystem');
      expect(type).toHaveProperty('icon');
      expect(type).toHaveProperty('order');
    });
  });

  it('should have isDeduction set to true for all deduction types', () => {
    DEFAULT_DEDUCTION_TYPES.forEach((type) => {
      expect(type.isDeduction).toBe(true);
    });
  });

  it('should have isSystem set to true for all deduction types', () => {
    DEFAULT_DEDUCTION_TYPES.forEach((type) => {
      expect(type.isSystem).toBe(true);
    });
  });

  it('should contain expected deduction types', () => {
    const names = DEFAULT_DEDUCTION_TYPES.map((type) => type.name);
    expect(names).toContain('Вычет');
    expect(names).toContain('Покупка');
  });

  it('should have higher order values than reward types', () => {
    const maxRewardOrder = Math.max(
      ...DEFAULT_REWARD_TYPES.map((type) => type.order)
    );
    const minDeductionOrder = Math.min(
      ...DEFAULT_DEDUCTION_TYPES.map((type) => type.order)
    );
    expect(minDeductionOrder).toBeGreaterThan(maxRewardOrder);
  });
});

describe('getDefaultEventTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an array combining reward and deduction types', () => {
    const result = getDefaultEventTypes();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(
      DEFAULT_REWARD_TYPES.length + DEFAULT_DEDUCTION_TYPES.length
    );
  });

  it('should add unique UUIDs to each event type', () => {
    const result = getDefaultEventTypes();
    const ids = result.map((type) => type.id);

    // All IDs should be defined
    ids.forEach((id) => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should generate different IDs on each call', () => {
    const result1 = getDefaultEventTypes();
    const result2 = getDefaultEventTypes();

    // IDs should be different between calls
    const ids1 = result1.map((type) => type.id);
    const ids2 = result2.map((type) => type.id);

    ids1.forEach((id, index) => {
      expect(id).not.toBe(ids2[index]);
    });
  });

  it('should preserve all original properties from defaults', () => {
    const result = getDefaultEventTypes();

    // Check a reward type
    const schoolType = result.find((type) => type.name === 'Посещение школы');
    expect(schoolType).toBeDefined();
    expect(schoolType?.defaultPoints).toBe(10);
    expect(schoolType?.isDeduction).toBe(false);
    expect(schoolType?.isSystem).toBe(true);
    expect(schoolType?.icon).toBe('🏫');

    // Check a deduction type
    const deductionType = result.find((type) => type.name === 'Вычет');
    expect(deductionType).toBeDefined();
    expect(deductionType?.isDeduction).toBe(true);
    expect(deductionType?.icon).toBe('➖');
  });
});

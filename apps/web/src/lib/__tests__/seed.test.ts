import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { supabase } from '@/lib/supabase';
import { seedDefaultEventTypes, hasEventTypes } from '../seed';
import { DEFAULT_REWARD_TYPES, DEFAULT_DEDUCTION_TYPES } from '@daily-rewards/core';

describe('seedDefaultEventTypes', () => {
  let mockFrom: Mock;
  let mockInsert: Mock;
  let mockSelect: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect = vi.fn();
    mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom = supabase.from as Mock;
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it('should insert all default event types for an admin', async () => {
    const mockData = [{ id: '1' }, { id: '2' }];
    mockSelect.mockResolvedValue({ data: mockData, error: null });

    const result = await seedDefaultEventTypes('admin-123');

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('event_types');
    expect(mockInsert).toHaveBeenCalled();

    // Verify the insert was called with correct number of items
    const insertCall = mockInsert.mock.calls[0][0];
    const expectedCount = DEFAULT_REWARD_TYPES.length + DEFAULT_DEDUCTION_TYPES.length;
    expect(insertCall.length).toBe(expectedCount);
  });

  it('should map event types to correct database format', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    await seedDefaultEventTypes('family-456');

    const insertCall = mockInsert.mock.calls[0][0];

    // Check first item structure
    const firstItem = insertCall[0];
    expect(firstItem).toHaveProperty('family_id', 'family-456');
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('default_points');
    expect(firstItem).toHaveProperty('is_deduction');
    expect(firstItem).toHaveProperty('icon');
    expect(firstItem).toHaveProperty('sort_order');
  });

  it('should return insertedCount on success', async () => {
    const mockData = [{ id: '1' }, { id: '2' }, { id: '3' }];
    mockSelect.mockResolvedValue({ data: mockData, error: null });

    const result = await seedDefaultEventTypes('admin-123');

    expect(result.success).toBe(true);
    expect(result.insertedCount).toBe(3);
  });

  it('should return error when insert fails', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await seedDefaultEventTypes('admin-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should handle unexpected exceptions', async () => {
    mockInsert.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = await seedDefaultEventTypes('admin-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unexpected error');
  });

  it('should handle non-Error exceptions', async () => {
    mockInsert.mockImplementation(() => {
      throw 'string error';
    });

    const result = await seedDefaultEventTypes('admin-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error occurred');
  });

  it('should set family_id for all inserted event types', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    await seedDefaultEventTypes('specific-family-id');

    const insertCall = mockInsert.mock.calls[0][0];
    insertCall.forEach((item: { family_id: string }) => {
      expect(item.family_id).toBe('specific-family-id');
    });
  });

  it('should preserve reward types with isDeduction false', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    await seedDefaultEventTypes('admin-123');

    const insertCall = mockInsert.mock.calls[0][0];
    const rewardItems = insertCall.slice(0, DEFAULT_REWARD_TYPES.length);
    rewardItems.forEach((item: { is_deduction: boolean }) => {
      expect(item.is_deduction).toBe(false);
    });
  });

  it('should preserve deduction types with isDeduction true', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    await seedDefaultEventTypes('admin-123');

    const insertCall = mockInsert.mock.calls[0][0];
    const deductionItems = insertCall.slice(DEFAULT_REWARD_TYPES.length);
    deductionItems.forEach((item: { is_deduction: boolean }) => {
      expect(item.is_deduction).toBe(true);
    });
  });
});

describe('hasEventTypes', () => {
  let mockFrom: Mock;
  let mockSelect: Mock;
  let mockEq: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEq = vi.fn();
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = supabase.from as Mock;
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('should return true when family has event types', async () => {
    mockEq.mockResolvedValue({ count: 5, error: null });

    const result = await hasEventTypes('family-123');

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('event_types');
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockEq).toHaveBeenCalledWith('family_id', 'family-123');
  });

  it('should return false when family has no event types', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null });

    const result = await hasEventTypes('family-123');

    expect(result).toBe(false);
  });

  it('should return false when count is null', async () => {
    mockEq.mockResolvedValue({ count: null, error: null });

    const result = await hasEventTypes('admin-123');

    expect(result).toBe(false);
  });

  it('should return false when query errors', async () => {
    mockEq.mockResolvedValue({
      count: null,
      error: { message: 'Query failed' },
    });

    const result = await hasEventTypes('admin-123');

    expect(result).toBe(false);
  });

  it('should return false on unexpected exception', async () => {
    mockEq.mockRejectedValue(new Error('Network error'));

    const result = await hasEventTypes('admin-123');

    expect(result).toBe(false);
  });

  it('should return true for count of 1', async () => {
    mockEq.mockResolvedValue({ count: 1, error: null });

    const result = await hasEventTypes('admin-123');

    expect(result).toBe(true);
  });
});

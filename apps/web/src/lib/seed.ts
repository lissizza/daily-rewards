import { supabase } from './supabase';
import {
  DEFAULT_REWARD_TYPES,
  DEFAULT_DEDUCTION_TYPES,
} from '@daily-rewards/core';
import type { Database } from '@/types/database';

type EventTypeInsert = Database['public']['Tables']['event_types']['Insert'];

/**
 * Seeds default event types for a new admin user.
 * This includes both reward types (positive points) and deduction types (negative points).
 *
 * @param adminId - The UUID of the admin user to seed event types for
 * @returns Object with success status and optional error message
 */
export async function seedDefaultEventTypes(adminId: string): Promise<{
  success: boolean;
  error?: string;
  insertedCount?: number;
}> {
  try {
    // Combine reward and deduction types
    const allDefaultTypes = [...DEFAULT_REWARD_TYPES, ...DEFAULT_DEDUCTION_TYPES];

    // Map to database insert format
    const eventTypesToInsert: EventTypeInsert[] = allDefaultTypes.map((type) => ({
      admin_id: adminId,
      name: type.name,
      default_points: type.defaultPoints,
      is_deduction: type.isDeduction,
      icon: type.icon,
      sort_order: type.order,
    }));

    // Insert all event types in a single batch
    const { data, error } = await supabase
      .from('event_types')
      .insert(eventTypesToInsert)
      .select('id');

    if (error) {
      console.error('[seedDefaultEventTypes] Failed to insert event types:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[seedDefaultEventTypes] Successfully seeded ${data?.length ?? 0} event types for admin ${adminId}`);

    return {
      success: true,
      insertedCount: data?.length ?? 0,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('[seedDefaultEventTypes] Unexpected error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Checks if an admin already has event types configured.
 * Used to prevent duplicate seeding.
 *
 * @param adminId - The UUID of the admin user to check
 * @returns Boolean indicating if event types already exist
 */
export async function hasEventTypes(adminId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('event_types')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId);

    if (error) {
      console.error('[hasEventTypes] Error checking event types:', error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (err) {
    console.error('[hasEventTypes] Unexpected error:', err);
    return false;
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          login: string | null;
          name: string;
          avatar_url: string | null;
          role: 'admin' | 'child';
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          login?: string | null;
          name: string;
          avatar_url?: string | null;
          role: 'admin' | 'child';
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          login?: string | null;
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'child';
          parent_id?: string | null;
          created_at?: string;
        };
      };
      event_types: {
        Row: {
          id: string;
          admin_id: string;
          name: string;
          default_points: number;
          is_deduction: boolean;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          name: string;
          default_points?: number;
          is_deduction?: boolean;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          name?: string;
          default_points?: number;
          is_deduction?: boolean;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          child_id: string;
          event_type_id: string | null;
          custom_name: string | null;
          points: number;
          note: string;
          date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          event_type_id?: string | null;
          custom_name?: string | null;
          points: number;
          note?: string;
          date: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          event_type_id?: string | null;
          custom_name?: string | null;
          points?: number;
          note?: string;
          date?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_child_balance: {
        Args: { p_child_id: string };
        Returns: number;
      };
      seed_default_event_types: {
        Args: { p_admin_id: string };
        Returns: void;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type EventType = Database['public']['Tables']['event_types']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];

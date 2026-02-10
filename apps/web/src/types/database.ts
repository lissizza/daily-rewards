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
      families: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          created_by?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          login: string | null;
          name: string;
          avatar_url: string | null;
          role: 'owner' | 'admin' | 'child';
          parent_id: string | null;
          family_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          login?: string | null;
          name: string;
          avatar_url?: string | null;
          role: 'owner' | 'admin' | 'child';
          parent_id?: string | null;
          family_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          login?: string | null;
          name?: string;
          avatar_url?: string | null;
          role?: 'owner' | 'admin' | 'child';
          parent_id?: string | null;
          family_id?: string | null;
          created_at?: string;
        };
      };
      event_types: {
        Row: {
          id: string;
          admin_id: string;
          family_id: string | null;
          name: string;
          default_points: number;
          is_deduction: boolean;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string;
          family_id?: string | null;
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
          family_id?: string | null;
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
          status: 'approved' | 'pending' | 'rejected';
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
          status?: 'approved' | 'pending' | 'rejected';
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
          status?: 'approved' | 'pending' | 'rejected';
        };
      };
    };
    Functions: {
      get_child_balance: {
        Args: { p_child_id: string };
        Returns: number;
      };
      get_email_by_login: {
        Args: { p_login: string };
        Returns: string | null;
      };
      seed_default_event_types: {
        Args: { p_admin_id: string };
        Returns: void;
      };
      get_pending_count: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
  };
}

export type Family = Database['public']['Tables']['families']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type EventType = Database['public']['Tables']['event_types']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];

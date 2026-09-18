/**
 * Database types for the Supabase client.
 *
 * Hand-written to match supabase/migrations. Once the schema is applied you can
 * regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type BoardPosition =
  | "presidenta"
  | "vicepresidenta"
  | "secretaria"
  | "tresorera"
  | "cap_de_foc"
  | "cap_de_tabals";

export type MemberRole = "diable" | "tabaler" | "supporter";
export type MemberStatus = "active" | "inactive" | "intermittent";
export type EventKind = "bolo" | "event" | "votacio";
export type BoloResponse = "diable" | "tabaler" | "supporter" | "no" | "si";
export type MeetingResponse = "yes" | "no";
export type BadgeType = "automatic" | "manual" | "repte";

type Timestamptz = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          nickname: string | null;
          email: string;
          phone: string | null;
          nif: string | null;
          birth_date: string | null;
          emergency_contact: string | null;
          medical_notes: string | null;
          bio: string | null;
          board_position: BoardPosition | null;
          is_admin: boolean;
          joined_date: string | null;
          sizes: Record<string, unknown>;
          gear_needs: Record<string, unknown>;
          bolo_count: number;
          foc_count: number;
          tabal_count: number;
          padri_foc_id: string | null;
          padri_tabal_id: string | null;
          member_status: MemberStatus;
          inactive_since: string | null;
          has_cre: boolean;
          has_rgcre: boolean;
          quota_automatic: boolean;
          avatar_url: string | null;
          created_at: Timestamptz;
          updated_at: Timestamptz;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          nickname?: string | null;
          phone?: string | null;
          nif?: string | null;
          birth_date?: string | null;
          emergency_contact?: string | null;
          medical_notes?: string | null;
          bio?: string | null;
          board_position?: BoardPosition | null;
          joined_date?: string | null;
          sizes?: Record<string, unknown>;
          gear_needs?: Record<string, unknown>;
          padri_foc_id?: string | null;
          padri_tabal_id?: string | null;
          member_status?: MemberStatus;
          has_cre?: boolean;
          has_rgcre?: boolean;
          quota_automatic?: boolean;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          kind: EventKind;
          title: string;
          starts_at: Timestamptz | null;
          location: string | null;
          organizer: string | null;
          description: string | null;
          place_note: string | null;
          time_note: string | null;
          map_url: string | null;
          ask_cars: boolean;
          ask_sizes: boolean;
          allowed_roles: MemberRole[];
          allow_multiple_options: boolean;
          allow_multiple_votes: boolean;
          agenda: string | null;
          affects: string | null;
          acta_url: string | null;
          closes_at: Timestamptz | null;
          created_by: string | null;
          created_at: Timestamptz;
          cancelled: boolean;
        };
        Insert: {
          id?: string;
          kind: EventKind;
          title: string;
          starts_at?: Timestamptz | null;
          location?: string | null;
          organizer?: string | null;
          description?: string | null;
          place_note?: string | null;
          time_note?: string | null;
          map_url?: string | null;
          ask_cars?: boolean;
          ask_sizes?: boolean;
          allowed_roles?: MemberRole[];
          allow_multiple_options?: boolean;
          allow_multiple_votes?: boolean;
          agenda?: string | null;
          affects?: string | null;
          acta_url?: string | null;
          closes_at?: Timestamptz | null;
          created_by?: string | null;
          cancelled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      poll_options: {
        Row: { id: string; event_id: string; label: string; position: number };
        Insert: { id?: string; event_id: string; label: string; position?: number };
        Update: Partial<Database["public"]["Tables"]["poll_options"]["Insert"]>;
        Relationships: [];
      };
      poll_votes: {
        Row: {
          event_id: string;
          option_id: string;
          member_id: string;
          created_at: Timestamptz;
        };
        Insert: { event_id: string; option_id: string; member_id: string };
        Update: Partial<Database["public"]["Tables"]["poll_votes"]["Insert"]>;
        Relationships: [];
      };
      bolo_attendance: {
        Row: {
          event_id: string;
          member_id: string;
          response: BoloResponse;
          brings_car: boolean;
          car_seats: number | null;
          size_snapshot: Record<string, unknown> | null;
          needs: string[];
          updated_at: Timestamptz;
        };
        Insert: {
          event_id: string;
          member_id: string;
          response: BoloResponse;
          brings_car?: boolean;
          car_seats?: number | null;
          size_snapshot?: Record<string, unknown> | null;
          needs?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["bolo_attendance"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bolo_attendance_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bolo_attendance_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_attendance: {
        Row: {
          event_id: string;
          member_id: string;
          response: MeetingResponse;
          updated_at: Timestamptz;
        };
        Insert: { event_id: string; member_id: string; response: MeetingResponse };
        Update: Partial<Database["public"]["Tables"]["meeting_attendance"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          event_id: string;
          member_id: string | null;
          body: string;
          created_at: Timestamptz;
        };
        Insert: { id?: string; event_id: string; member_id: string; body: string };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      badge_definitions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string;
          type: BadgeType;
          criteria: Record<string, unknown> | null;
          repte_pattern: string | null;
          created_at: Timestamptz;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string;
          type: BadgeType;
          criteria?: Record<string, unknown> | null;
          repte_pattern?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["badge_definitions"]["Insert"]>;
        Relationships: [];
      };
      quota_payments: {
        Row: { member_id: string; year: number; paid: boolean };
        Insert: { member_id: string; year: number; paid?: boolean };
        Update: Partial<Database["public"]["Tables"]["quota_payments"]["Insert"]>;
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          kind: string | null;
          gp_url: string | null;
          tempo: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: Timestamptz;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          kind?: string | null;
          gp_url?: string | null;
          tempo?: number | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["songs"]["Insert"]>;
        Relationships: [];
      };
      member_badges: {
        Row: {
          id: string;
          member_id: string;
          badge_id: string;
          earned_at: Timestamptz;
          granted_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          badge_id: string;
          earned_at?: Timestamptz;
          granted_by?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["member_badges"]["Insert"]>;
        Relationships: [];
      };
      event_options: {
        Row: {
          id: string;
          event_id: string;
          label: string;
          kind: "boolean" | "text";
          position: number;
          created_at: Timestamptz;
        };
        Insert: {
          id?: string;
          event_id: string;
          label: string;
          kind?: "boolean" | "text";
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["event_options"]["Insert"]>;
        Relationships: [];
      };
      bolo_attendance_responses: {
        Row: {
          event_id: string;
          member_id: string;
          option_id: string;
          value: string | null;
        };
        Insert: {
          event_id: string;
          member_id: string;
          option_id: string;
          value?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bolo_attendance_responses"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      event_counts: {
        Row: {
          event_id: string;
          signup_count: number;
          confirmed_count: number;
          vote_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      refresh_member_counts: { Args: { p_member_id: string }; Returns: void };
      award_automatic_badges: { Args: { p_member_id: string }; Returns: void };
      award_repte_badges: { Args: { p_member_id: string }; Returns: void };
    };
    Enums: {
      board_position: BoardPosition;
      member_role: MemberRole;
      member_status: MemberStatus;
      event_kind: EventKind;
    };
    CompositeTypes: Record<string, never>;
  };
}

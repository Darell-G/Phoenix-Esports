export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          campus_verified: boolean;
          course_year: string;
          created_at: string;
          email: string;
          experience: string;
          id: string;
          internal_notes: string;
          member_id: string | null;
          name: string;
          opening_id: string;
          public_feedback: string;
          reference: string;
          status: string;
          student_number: string;
        };
        Insert: {
          campus_verified?: boolean;
          course_year: string;
          created_at?: string;
          email: string;
          experience?: string;
          id?: string;
          internal_notes?: string;
          member_id?: string | null;
          name: string;
          opening_id: string;
          public_feedback?: string;
          reference?: string;
          status?: string;
          student_number: string;
        };
        Update: {
          campus_verified?: boolean;
          course_year?: string;
          created_at?: string;
          email?: string;
          experience?: string;
          id?: string;
          internal_notes?: string;
          member_id?: string | null;
          name?: string;
          opening_id?: string;
          public_feedback?: string;
          reference?: string;
          status?: string;
          student_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_opening_id_fkey";
            columns: ["opening_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string;
          id: number;
          reason: string;
          record_id: string;
          record_label: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          id?: never;
          reason?: string;
          record_id: string;
          record_label?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          id?: never;
          reason?: string;
          record_id?: string;
          record_label?: string;
        };
        Relationships: [];
      };
      content: {
        Row: {
          availability: string;
          body: string;
          capacity: number;
          category: string;
          champion_name: string;
          created_at: string;
          deadline: string | null;
          ends_at: string | null;
          external_url: string;
          featured: boolean;
          game: string;
          id: string;
          image_url: string | null;
          kind: string;
          price: number | null;
          roster_size: number;
          slug: string;
          starts_at: string | null;
          status: string;
          substitutes: number;
          summary: string;
          title: string;
          updated_at: string;
          variants: string[];
          venue: string;
        };
        Insert: {
          availability?: string;
          body?: string;
          capacity?: number;
          category?: string;
          champion_name?: string;
          created_at?: string;
          deadline?: string | null;
          ends_at?: string | null;
          external_url?: string;
          featured?: boolean;
          game?: string;
          id?: string;
          image_url?: string | null;
          kind: string;
          price?: number | null;
          roster_size?: number;
          slug: string;
          starts_at?: string | null;
          status?: string;
          substitutes?: number;
          summary?: string;
          title: string;
          updated_at?: string;
          variants?: string[];
          venue?: string;
        };
        Update: {
          availability?: string;
          body?: string;
          capacity?: number;
          category?: string;
          champion_name?: string;
          created_at?: string;
          deadline?: string | null;
          ends_at?: string | null;
          external_url?: string;
          featured?: boolean;
          game?: string;
          id?: string;
          image_url?: string | null;
          kind?: string;
          price?: number | null;
          roster_size?: number;
          slug?: string;
          starts_at?: string | null;
          status?: string;
          substitutes?: number;
          summary?: string;
          title?: string;
          updated_at?: string;
          variants?: string[];
          venue?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          position: number;
          resolved: boolean;
          round: number;
          score_a: number | null;
          score_b: number | null;
          starts_at: string | null;
          team_a: string | null;
          team_b: string | null;
          tournament_id: string;
          version: number;
          winner_id: string | null;
        };
        Insert: {
          id?: string;
          position: number;
          resolved?: boolean;
          round: number;
          score_a?: number | null;
          score_b?: number | null;
          starts_at?: string | null;
          team_a?: string | null;
          team_b?: string | null;
          tournament_id: string;
          version?: number;
          winner_id?: string | null;
        };
        Update: {
          id?: string;
          position?: number;
          resolved?: boolean;
          round?: number;
          score_a?: number | null;
          score_b?: number | null;
          starts_at?: string | null;
          team_a?: string | null;
          team_b?: string | null;
          tournament_id?: string;
          version?: number;
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_team_a_fkey";
            columns: ["team_a"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_team_b_fkey";
            columns: ["team_b"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          academic_term: string;
          active: boolean;
          category: string;
          created_at: string;
          game: string;
          id: string;
          name: string;
          position: string;
          public_visible: boolean;
          team: string;
        };
        Insert: {
          academic_term?: string;
          active?: boolean;
          category: string;
          created_at?: string;
          game?: string;
          id?: string;
          name: string;
          position?: string;
          public_visible?: boolean;
          team?: string;
        };
        Update: {
          academic_term?: string;
          active?: boolean;
          category?: string;
          created_at?: string;
          game?: string;
          id?: string;
          name?: string;
          position?: string;
          public_visible?: boolean;
          team?: string;
        };
        Relationships: [];
      };
      officer_committee_invitations: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          is_admin: boolean;
          modules: string[];
          name: string;
          organization_role: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          is_admin?: boolean;
          modules?: string[];
          name?: string;
          organization_role?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          is_admin?: boolean;
          modules?: string[];
          name?: string;
          organization_role?: string;
        };
        Relationships: [];
      };
      officers_and_committees: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          is_admin: boolean;
          modules: string[];
          name: string;
          organization_role: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          is_admin?: boolean;
          modules?: string[];
          name?: string;
          organization_role?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          is_admin?: boolean;
          modules?: string[];
          name?: string;
          organization_role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      public_teams: {
        Row: {
          aliases: string[];
          id: string;
          name: string;
          seed: number | null;
          tournament_id: string;
        };
        Insert: {
          aliases?: string[];
          id: string;
          name: string;
          seed?: number | null;
          tournament_id: string;
        };
        Update: {
          aliases?: string[];
          id?: string;
          name?: string;
          seed?: number | null;
          tournament_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_teams_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_teams_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          about: string;
          contact_email: string;
          id: number;
          inquiry_url: string;
          social_url: string;
        };
        Insert: {
          about?: string;
          contact_email?: string;
          id?: number;
          inquiry_url?: string;
          social_url?: string;
        };
        Update: {
          about?: string;
          contact_email?: string;
          id?: number;
          inquiry_url?: string;
          social_url?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          campus_verified: boolean;
          captain: string;
          created_at: string;
          email: string;
          id: string;
          internal_notes: string;
          name: string;
          public_feedback: string;
          reference: string;
          roster: Json;
          seed: number | null;
          status: string;
          tournament_id: string;
        };
        Insert: {
          campus_verified?: boolean;
          captain: string;
          created_at?: string;
          email: string;
          id?: string;
          internal_notes?: string;
          name: string;
          public_feedback?: string;
          reference?: string;
          roster: Json;
          seed?: number | null;
          status?: string;
          tournament_id: string;
        };
        Update: {
          campus_verified?: boolean;
          captain?: string;
          created_at?: string;
          email?: string;
          id?: string;
          internal_notes?: string;
          name?: string;
          public_feedback?: string;
          reference?: string;
          roster?: Json;
          seed?: number | null;
          status?: string;
          tournament_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_fixtures: {
        Row: {
          created_at: string;
          id: string;
          round_label: string;
          starts_at: string | null;
          status: string;
          team_a_id: string;
          team_b_id: string;
          tournament_id: string;
          updated_at: string;
          version: number;
          winner_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          round_label?: string;
          starts_at?: string | null;
          status?: string;
          team_a_id: string;
          team_b_id: string;
          tournament_id: string;
          updated_at?: string;
          version?: number;
          winner_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          round_label?: string;
          starts_at?: string | null;
          status?: string;
          team_a_id?: string;
          team_b_id?: string;
          tournament_id?: string;
          updated_at?: string;
          version?: number;
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_fixtures_team_a_id_fkey";
            columns: ["team_a_id"];
            isOneToOne: false;
            referencedRelation: "tournament_scoreboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_fixtures_team_b_id_fkey";
            columns: ["team_b_id"];
            isOneToOne: false;
            referencedRelation: "tournament_scoreboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_fixtures_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_fixtures_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "tournament_scoreboard";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_scoreboard: {
        Row: {
          created_at: string;
          id: string;
          losses: number;
          team_name: string;
          tournament_id: string;
          updated_at: string;
          version: number;
          wins: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          losses?: number;
          team_name: string;
          tournament_id: string;
          updated_at?: string;
          version?: number;
          wins?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          losses?: number;
          team_name?: string;
          tournament_id?: string;
          updated_at?: string;
          version?: number;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_scoreboard_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_challenge: {
        Args: {
          p_email: string;
          p_hash: string;
          p_purpose: string;
          p_target: string;
        };
        Returns: string;
      };
      delete_content: { Args: { p_id: string }; Returns: undefined };
      email_limit: {
        Args: { p_key: string; p_limit: number; p_seconds: number };
        Returns: boolean;
      };
      generate_bracket: {
        Args: { p_actor: string; p_id: string; p_reason: string };
        Returns: undefined;
      };
      lookup_status: { Args: { p_hash: string }; Returns: Json };
      portal_action: {
        Args: {
          p_action: string;
          p_actor: string;
          p_data: Json;
          p_id: string;
          p_reason: string;
        };
        Returns: undefined;
      };
      record_result: {
        Args: {
          p_actor: string;
          p_match: string;
          p_reason: string;
          p_score_a: number;
          p_score_b: number;
          p_starts_at?: string;
          p_version: number;
        };
        Returns: undefined;
      };
      renew_status: {
        Args: {
          p_challenge: string;
          p_grant_hash: string;
          p_reference: string;
          p_token_hash: string;
        };
        Returns: boolean;
      };
      save_content: {
        Args: { p_data: Json; p_id: string; p_reason?: string };
        Returns: string;
      };
      save_portal_access: {
        Args: { p_data: Json; p_id: string };
        Returns: Json;
      };
      save_portal_invitation: {
        Args: {
          p_actor: string;
          p_admin: boolean;
          p_email: string;
          p_modules: string[];
          p_name: string;
          p_organization_role?: string;
          p_reason: string;
        };
        Returns: undefined;
      };
      submit_verified: {
        Args: {
          p_challenge: string;
          p_grant_hash: string;
          p_payload: Json;
          p_token_hash: string;
        };
        Returns: Json;
      };
      verify_challenge: {
        Args: { p_grant_hash: string; p_hash: string; p_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

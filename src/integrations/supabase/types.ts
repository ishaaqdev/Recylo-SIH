export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bins: {
        Row: {
          hazardous: number
          household_id: string | null
          id: string
          last_updated: string
          non_recyclable: number
          organic: number
          recyclable: number
        }
        Insert: {
          hazardous?: number
          household_id?: string | null
          id?: string
          last_updated?: string
          non_recyclable?: number
          organic?: number
          recyclable?: number
        }
        Update: {
          hazardous?: number
          household_id?: string | null
          id?: string
          last_updated?: string
          non_recyclable?: number
          organic?: number
          recyclable?: number
        }
        Relationships: [
          {
            foreignKeyName: "bins_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_logs: {
        Row: {
          collected_at: string
          driver_id: string | null
          household_id: string | null
          id: string
          segregation_status: string | null
          status: string
        }
        Insert: {
          collected_at?: string
          driver_id?: string | null
          household_id?: string | null
          id?: string
          segregation_status?: string | null
          status?: string
        }
        Update: {
          collected_at?: string
          driver_id?: string | null
          household_id?: string | null
          id?: string
          segregation_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          category: string
          created_at: string
          description: string | null
          household_id: string | null
          id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          household_id?: string | null
          id?: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          household_id?: string | null
          id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          discount: string
          expiry_date: string | null
          household_id: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          discount: string
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          discount?: string
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      course_completions: {
        Row: {
          completed_at: string | null
          course_id: string | null
          id: string
          progress_percent: number
          quiz_score: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          id?: string
          progress_percent?: number
          quiz_score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          id?: string
          progress_percent?: number
          quiz_score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "safety_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ecofacts: {
        Row: {
          category: string | null
          icon: string | null
          id: string
          text: string
        }
        Insert: {
          category?: string | null
          icon?: string | null
          id?: string
          text: string
        }
        Update: {
          category?: string | null
          icon?: string | null
          id?: string
          text?: string
        }
        Relationships: []
      }
      hazard_reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          hazard_type: string
          id: string
          image_url: string | null
          location: string
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          hazard_type: string
          id?: string
          image_url?: string | null
          location: string
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          hazard_type?: string
          id?: string
          image_url?: string | null
          location?: string
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Relationships: []
      }
      households: {
        Row: {
          address: string | null
          created_at: string
          id: string
          level: number
          name: string
          phone: string | null
          points: number
          qr_code: string | null
          total_waste_recycled: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          level?: number
          name: string
          phone?: string | null
          points?: number
          qr_code?: string | null
          total_waste_recycled?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          level?: number
          name?: string
          phone?: string | null
          points?: number
          qr_code?: string | null
          total_waste_recycled?: number
          updated_at?: string
        }
        Relationships: []
      }
      municipal_users: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rewards_tasks: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          level_reward: number
          points_reward: number
          time_limit: string | null
          title: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          level_reward?: number
          points_reward?: number
          time_limit?: string | null
          title: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          level_reward?: number
          points_reward?: number
          time_limit?: string | null
          title?: string
        }
        Relationships: []
      }
      safety_courses: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          title: string
        }
        Insert: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      spinwheel_rewards: {
        Row: {
          icon: string | null
          id: string
          reward_type: string
          reward_value: number
          title: string
        }
        Insert: {
          icon?: string | null
          id?: string
          reward_type: string
          reward_value?: number
          title: string
        }
        Update: {
          icon?: string | null
          id?: string
          reward_type?: string
          reward_value?: number
          title?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          household_id: string | null
          id: string
          started_at: string
          status: string
          task_id: string | null
        }
        Insert: {
          completed_at?: string | null
          household_id?: string | null
          id?: string
          started_at?: string
          status?: string
          task_id?: string | null
        }
        Update: {
          completed_at?: string | null
          household_id?: string | null
          id?: string
          started_at?: string
          status?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "rewards_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

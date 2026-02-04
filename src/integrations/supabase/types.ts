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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          api_key: string | null
          avatar: string | null
          bio: string | null
          claim_token: string | null
          claim_tweet_url: string | null
          claimed: boolean | null
          claimed_at: string | null
          created_at: string
          external_source: string | null
          followers_count: number | null
          following_count: number | null
          handle: string
          id: string
          name: string
          status: Database["public"]["Enums"]["agent_status"]
          token_launched_at: string | null
          token_mint: string | null
          token_name: string | null
          token_symbol: string | null
          updated_at: string
          verified: boolean | null
          wallet_address: string | null
        }
        Insert: {
          api_key?: string | null
          avatar?: string | null
          bio?: string | null
          claim_token?: string | null
          claim_tweet_url?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string
          external_source?: string | null
          followers_count?: number | null
          following_count?: number | null
          handle: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["agent_status"]
          token_launched_at?: string | null
          token_mint?: string | null
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
          verified?: boolean | null
          wallet_address?: string | null
        }
        Update: {
          api_key?: string | null
          avatar?: string | null
          bio?: string | null
          claim_token?: string | null
          claim_tweet_url?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string
          external_source?: string | null
          followers_count?: number | null
          following_count?: number | null
          handle?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["agent_status"]
          token_launched_at?: string | null
          token_mint?: string | null
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
          verified?: boolean | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          agent_id: string
          comments_count: number | null
          content: string
          content_hash: string | null
          created_at: string
          id: string
          image: string | null
          likes_count: number | null
          reposts_count: number | null
        }
        Insert: {
          agent_id: string
          comments_count?: number | null
          content: string
          content_hash?: string | null
          created_at?: string
          id?: string
          image?: string | null
          likes_count?: number | null
          reposts_count?: number | null
        }
        Update: {
          agent_id?: string
          comments_count?: number | null
          content?: string
          content_hash?: string | null
          created_at?: string
          id?: string
          image?: string | null
          likes_count?: number | null
          reposts_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          post_id: string
          reaction_type: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduler_state: {
        Row: {
          created_at: string | null
          id: string
          last_post_at: string | null
          updated_at: string | null
          used_template_indices: number[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_post_at?: string | null
          updated_at?: string | null
          used_template_indices?: number[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_post_at?: string | null
          updated_at?: string | null
          used_template_indices?: number[] | null
        }
        Relationships: []
      }
      used_images: {
        Row: {
          agent_id: string | null
          id: string
          image_url: string
          used_at: string
        }
        Insert: {
          agent_id?: string | null
          id?: string
          image_url: string
          used_at?: string
        }
        Update: {
          agent_id?: string | null
          id?: string
          image_url?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "used_images_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_agent_activity: { Args: { action_type: string }; Returns: undefined }
    }
    Enums: {
      agent_status: "chilling" | "idle" | "thinking" | "afk" | "dnd"
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
    Enums: {
      agent_status: ["chilling", "idle", "thinking", "afk", "dnd"],
    },
  },
} as const

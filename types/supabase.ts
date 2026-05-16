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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          deal_id: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      deal_buyers: {
        Row: {
          buyer_id: string
          deal_id: string
          om_opened_at: string | null
          om_sent_at: string | null
          tracking_token: string
        }
        Insert: {
          buyer_id: string
          deal_id: string
          om_opened_at?: string | null
          om_sent_at?: string | null
          tracking_token?: string
        }
        Update: {
          buyer_id?: string
          deal_id?: string
          om_opened_at?: string | null
          om_sent_at?: string | null
          tracking_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_buyers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_buyers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_files: {
        Row: {
          created_at: string | null
          deal_id: string
          file_name: string
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          file_name: string
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          file_name?: string
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_files_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          address: string | null
          commercial_confidence_score: number | null
          created_at: string | null
          description: string | null
          id: string
          neighborhood: string | null
          price: string | null
          property_type: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          commercial_confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          neighborhood?: string | null
          price?: string | null
          property_type?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          commercial_confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          neighborhood?: string | null
          price?: string | null
          property_type?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investors: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          desired_yield: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_neighborhoods: string[] | null
          property_types: string[] | null
          risk_level: string
          strategy: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          desired_yield?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_neighborhoods?: string[] | null
          property_types?: string[] | null
          risk_level?: string
          strategy?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          desired_yield?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_neighborhoods?: string[] | null
          property_types?: string[] | null
          risk_level?: string
          strategy?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investor_listing_matches: {
        Row: {
          breakdown: Json
          concerns: Json
          confidence: string
          created_at: string | null
          explanation: string
          generated_at: string
          id: string
          input_data_hash: string | null
          investor_id: string
          listing_id: string
          match_score: number
          match_status: string
          missing_data: Json
          processed_at: string
          recommended_action: string
          reasons: Json
          strengths: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          breakdown?: Json
          concerns?: Json
          confidence?: string
          created_at?: string | null
          explanation: string
          generated_at?: string
          id?: string
          input_data_hash?: string | null
          investor_id: string
          listing_id: string
          match_score: number
          match_status: string
          missing_data?: Json
          processed_at?: string
          recommended_action?: string
          reasons?: Json
          strengths?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          breakdown?: Json
          concerns?: Json
          confidence?: string
          created_at?: string | null
          explanation?: string
          generated_at?: string
          id?: string
          input_data_hash?: string | null
          investor_id?: string
          listing_id?: string
          match_score?: number
          match_status?: string
          missing_data?: Json
          processed_at?: string
          recommended_action?: string
          reasons?: Json
          strengths?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_listing_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_listing_matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_fit_scores: {
        Row: {
          best_fit_reasons: Json
          breakdown: Json
          confidence: string
          created_at: string | null
          generated_at: string
          id: string
          input_data_hash: string
          listing_id: string
          missing_data: Json
          score: number
          strategy: string
          strengths: Json
          updated_at: string | null
          user_id: string
          weaknesses: Json
        }
        Insert: {
          best_fit_reasons?: Json
          breakdown?: Json
          confidence: string
          created_at?: string | null
          generated_at?: string
          id?: string
          input_data_hash: string
          listing_id: string
          missing_data?: Json
          score: number
          strategy: string
          strengths?: Json
          updated_at?: string | null
          user_id: string
          weaknesses?: Json
        }
        Update: {
          best_fit_reasons?: Json
          breakdown?: Json
          confidence?: string
          created_at?: string | null
          generated_at?: string
          id?: string
          input_data_hash?: string
          listing_id?: string
          missing_data?: Json
          score?: number
          strategy?: string
          strengths?: Json
          updated_at?: string | null
          user_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "strategy_fit_scores_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_ai_summaries: {
        Row: {
          created_at: string | null
          error_message: string | null
          generated_at: string | null
          id: string
          input_data_hash: string | null
          listing_id: string
          model: string | null
          provider: string | null
          status: string
          summary: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          input_data_hash?: string | null
          listing_id: string
          model?: string | null
          provider?: string | null
          status?: string
          summary?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          input_data_hash?: string | null
          listing_id?: string
          model?: string | null
          provider?: string | null
          status?: string
          summary?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_ai_summaries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      location_insights: {
        Row: {
          address: string | null
          avg_income: number | null
          city: string
          confidence_score: number | null
          consumer_profile: string | null
          country: string
          created_at: string | null
          data_sources: Json
          id: string
          latitude: number | null
          listing_id: string | null
          longitude: number | null
          nearby_businesses: Json
          neighborhood: string | null
          population_density: number | null
          raw_demographics: Json
          raw_geocode: Json
          raw_places: Json
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avg_income?: number | null
          city: string
          confidence_score?: number | null
          consumer_profile?: string | null
          country?: string
          created_at?: string | null
          data_sources?: Json
          id?: string
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          nearby_businesses?: Json
          neighborhood?: string | null
          population_density?: number | null
          raw_demographics?: Json
          raw_geocode?: Json
          raw_places?: Json
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avg_income?: number | null
          city?: string
          confidence_score?: number | null
          consumer_profile?: string | null
          country?: string
          created_at?: string | null
          data_sources?: Json
          id?: string
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          nearby_businesses?: Json
          neighborhood?: string | null
          population_density?: number | null
          raw_demographics?: Json
          raw_geocode?: Json
          raw_places?: Json
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_insights_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_import_targets: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_active: boolean
          search_term: string
          source: string
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          search_term: string
          source: string
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          search_term?: string
          source?: string
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      listing_import_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_count: number
          error_message: string | null
          failed_count: number
          id: string
          metadata: Json | null
          skipped_count: number
          source: string
          started_at: string | null
          status: string
          target_id: string | null
          updated_count: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_count?: number
          error_message?: string | null
          failed_count?: number
          id?: string
          metadata?: Json | null
          skipped_count?: number
          source: string
          started_at?: string | null
          status?: string
          target_id?: string | null
          updated_count?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_count?: number
          error_message?: string | null
          failed_count?: number
          id?: string
          metadata?: Json | null
          skipped_count?: number
          source?: string
          started_at?: string | null
          status?: string
          target_id?: string | null
          updated_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_import_runs_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "listing_import_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address_text: string | null
          city: string | null
          commercial_type: string | null
          confidence: number | null
          country: string
          created_at: string | null
          description: string | null
          enrichment_error: string | null
          enrichment_last_processed_at: string | null
          enrichment_status: string
          first_seen_at: string | null
          id: string
          images: string[] | null
          is_commercial: boolean | null
          last_seen_at: string | null
          lat: number | null
          lng: number | null
          location_text: string | null
          matching_error: string | null
          matching_last_processed_at: string | null
          matching_status: string
          neighborhood: string | null
          price_amount: number | null
          price_text: string | null
          raw_payload: Json | null
          reasoning: string | null
          source: string
          source_url: string
          state: string | null
          tags: string[] | null
          title: string
          property_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_text?: string | null
          city?: string | null
          commercial_type?: string | null
          confidence?: number | null
          country?: string
          created_at?: string | null
          description?: string | null
          enrichment_error?: string | null
          enrichment_last_processed_at?: string | null
          enrichment_status?: string
          first_seen_at?: string | null
          id?: string
          images?: string[] | null
          is_commercial?: boolean | null
          last_seen_at?: string | null
          lat?: number | null
          lng?: number | null
          location_text?: string | null
          matching_error?: string | null
          matching_last_processed_at?: string | null
          matching_status?: string
          neighborhood?: string | null
          price_amount?: number | null
          price_text?: string | null
          raw_payload?: Json | null
          reasoning?: string | null
          source: string
          source_url: string
          state?: string | null
          tags?: string[] | null
          title: string
          property_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_text?: string | null
          city?: string | null
          commercial_type?: string | null
          confidence?: number | null
          country?: string
          created_at?: string | null
          description?: string | null
          enrichment_error?: string | null
          enrichment_last_processed_at?: string | null
          enrichment_status?: string
          first_seen_at?: string | null
          id?: string
          images?: string[] | null
          is_commercial?: boolean | null
          last_seen_at?: string | null
          lat?: number | null
          lng?: number | null
          location_text?: string | null
          matching_error?: string | null
          matching_last_processed_at?: string | null
          matching_status?: string
          neighborhood?: string | null
          price_amount?: number | null
          price_text?: string | null
          raw_payload?: Json | null
          reasoning?: string | null
          source?: string
          source_url?: string
          state?: string | null
          tags?: string[] | null
          title?: string
          property_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          deal_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deal_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_scores: {
        Row: {
          breakdown: Json
          competition_score: number | null
          computed_at: string | null
          created_at: string | null
          demographics_score: number | null
          engine_version: string
          fit_label: string | null
          foot_traffic_score: number | null
          id: string
          investor_fit_score: number | null
          listing_id: string
          location_score: number | null
          risks: Json
          risk_score: number | null
          score_version: number
          signals: Json
          strategy_slug: string
          total_score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          breakdown?: Json
          competition_score?: number | null
          computed_at?: string | null
          created_at?: string | null
          demographics_score?: number | null
          engine_version?: string
          fit_label?: string | null
          foot_traffic_score?: number | null
          id?: string
          investor_fit_score?: number | null
          listing_id: string
          location_score?: number | null
          risks?: Json
          risk_score?: number | null
          score_version?: number
          signals?: Json
          strategy_slug: string
          total_score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          breakdown?: Json
          competition_score?: number | null
          computed_at?: string | null
          created_at?: string | null
          demographics_score?: number | null
          engine_version?: string
          fit_label?: string | null
          foot_traffic_score?: number | null
          id?: string
          investor_fit_score?: number | null
          listing_id?: string
          location_score?: number | null
          risks?: Json
          risk_score?: number | null
          score_version?: number
          signals?: Json
          strategy_slug?: string
          total_score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_scores_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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

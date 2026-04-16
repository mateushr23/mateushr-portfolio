// Hand-authored Supabase schema types for the `mateushr-portfolio` project.
//
// Auto-generation command (run once the project is linked to Supabase):
//   npx supabase gen types typescript --linked > src/types/database.ts
//
// Until then, keep this file in sync by hand with
// supabase/migrations/20260416120000_init_repos.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      repos: {
        Row: {
          id: string;
          github_id: number;
          name: string;
          description_ai: string | null;
          language: string | null;
          stars: number;
          url: string;
          pushed_at: string;
          is_featured: boolean;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          github_id: number;
          name: string;
          description_ai?: string | null;
          language?: string | null;
          stars?: number;
          url: string;
          pushed_at: string;
          is_featured?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          github_id?: number;
          name?: string;
          description_ai?: string | null;
          language?: string | null;
          stars?: number;
          url?: string;
          pushed_at?: string;
          is_featured?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience aliases
export type Repo = Database["public"]["Tables"]["repos"]["Row"];
export type RepoInsert = Database["public"]["Tables"]["repos"]["Insert"];
export type RepoUpdate = Database["public"]["Tables"]["repos"]["Update"];

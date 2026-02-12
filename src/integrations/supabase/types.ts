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
      alunos: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_ingresso: string | null
          data_nascimento: string | null
          endereco: string | null
          estado: string | null
          id: string
          matricula: string
          responsavel_nome: string | null
          responsavel_telefone: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_ingresso?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          matricula: string
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_ingresso?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          matricula?: string
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          duracao_semestres: number | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          duracao_semestres?: number | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          duracao_semestres?: number | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          ativo: boolean | null
          carga_horaria: number | null
          codigo: string | null
          created_at: string
          curso_id: string | null
          id: string
          nome: string
          professor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria?: number | null
          codigo?: string | null
          created_at?: string
          curso_id?: string | null
          id?: string
          nome: string
          professor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          carga_horaria?: number | null
          codigo?: string | null
          created_at?: string
          curso_id?: string | null
          id?: string
          nome?: string
          professor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          aluno_id: string | null
          arquivo_nome: string | null
          arquivo_tipo: string | null
          arquivo_url: string | null
          categoria: string | null
          created_at: string
          curso_id: string | null
          descricao: string | null
          id: string
          titulo: string
          turma_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          aluno_id?: string | null
          arquivo_nome?: string | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          created_at?: string
          curso_id?: string | null
          descricao?: string | null
          id?: string
          titulo: string
          turma_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          aluno_id?: string | null
          arquivo_nome?: string | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          created_at?: string
          curso_id?: string | null
          descricao?: string | null
          id?: string
          titulo?: string
          turma_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia: {
        Row: {
          aluno_id: string
          created_at: string
          data: string
          disciplina_id: string
          id: string
          justificativa: string | null
          presente: boolean | null
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data: string
          disciplina_id: string
          id?: string
          justificativa?: string | null
          presente?: boolean | null
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data?: string
          disciplina_id?: string
          id?: string
          justificativa?: string | null
          presente?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          aluno_id: string
          created_at: string
          data_matricula: string | null
          id: string
          status: string | null
          turma_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_matricula?: string | null
          id?: string
          status?: string | null
          turma_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_matricula?: string | null
          id?: string
          status?: string | null
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          aluno_id: string
          created_at: string
          disciplina_id: string
          id: string
          media: number | null
          nota1: number | null
          nota2: number | null
          nota3: number | null
          nota4: number | null
          observacao: string | null
          professor_id: string | null
          semestre_letivo: string | null
          status: string | null
          turma_id: string | null
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          disciplina_id: string
          id?: string
          media?: number | null
          nota1?: number | null
          nota2?: number | null
          nota3?: number | null
          nota4?: number | null
          observacao?: string | null
          professor_id?: string | null
          semestre_letivo?: string | null
          status?: string | null
          turma_id?: string | null
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          disciplina_id?: string
          id?: string
          media?: number | null
          nota1?: number | null
          nota2?: number | null
          nota3?: number | null
          nota4?: number | null
          observacao?: string | null
          professor_id?: string | null
          semestre_letivo?: string | null
          status?: string | null
          turma_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_disciplinas: {
        Row: {
          id: string
          professor_id: string
          disciplina_id: string
          turma_id: string | null
          ano: number | null
          semestre: number | null
          ativo: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          disciplina_id: string
          turma_id?: string | null
          ano?: number | null
          semestre?: number | null
          ativo?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          disciplina_id?: string
          turma_id?: string | null
          ano?: number | null
          semestre?: number | null
          ativo?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_disciplinas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_disciplinas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turma_disciplinas: {
        Row: {
          id: string
          turma_id: string
          disciplina_id: string
          created_at: string
        }
        Insert: {
          id?: string
          turma_id: string
          disciplina_id: string
          created_at?: string
        }
        Update: {
          id?: string
          turma_id?: string
          disciplina_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_disciplinas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_disciplinas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      requerimentos: {
        Row: {
          anexo_url: string | null
          created_at: string
          descricao: string | null
          id: string
          respondido_em: string | null
          respondido_por: string | null
          resposta: string | null
          resposta_anexo_url: string | null
          solicitante_id: string
          status: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anexo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          resposta_anexo_url?: string | null
          solicitante_id: string
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anexo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          resposta_anexo_url?: string | null
          solicitante_id?: string
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ano: number | null
          ativo: boolean | null
          codigo: string | null
          created_at: string
          curso_id: string | null
          id: string
          max_alunos: number | null
          nome: string
          semestre: number | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string
          curso_id?: string | null
          id?: string
          max_alunos?: number | null
          nome: string
          semestre?: number | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string
          curso_id?: string | null
          id?: string
          max_alunos?: number | null
          nome?: string
          semestre?: number | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_alunos_by_turma: {
        Args: { _turma_id: string }
        Returns: { aluno_id: string; aluno_nome: string; matricula: string }[]
      }
      get_professor_disciplinas: {
        Args: { _professor_id: string }
        Returns: { disciplina_id: string; disciplina_nome: string; turma_id: string; turma_nome: string; curso_nome: string }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretaria" | "professor" | "aluno" | "coordenador"
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
      app_role: ["admin", "secretaria", "professor", "aluno", "coordenador"],
    },
  },
} as const

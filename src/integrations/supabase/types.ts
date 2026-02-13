export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string
          name: string
          slug: string
          cnpj: string | null
          email: string | null
          phone: string | null
          logo_url: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          website: string | null
          plan_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          subscription_ends_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          settings: Json
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          website?: string | null
          plan_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          settings?: Json
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          website?: string | null
          plan_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          settings?: Json
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_monthly: number | null
          price_yearly: number | null
          max_users: number | null
          max_turmas: number | null
          max_cursos: number | null
          max_storage_mb: number | null
          features: Json
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          max_users?: number | null
          max_turmas?: number | null
          max_cursos?: number | null
          max_storage_mb?: number | null
          features?: Json
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          max_users?: number | null
          max_turmas?: number | null
          max_cursos?: number | null
          max_storage_mb?: number | null
          features?: Json
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          institution_id: string
          plan_id: string
          status: string | null
          current_period_start: string | null
          current_period_end: string | null
          stripe_subscription_id: string | null
          stripe_invoice_id: string | null
          amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          plan_id: string
          status?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_subscription_id?: string | null
          stripe_invoice_id?: string | null
          amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          plan_id?: string
          status?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_subscription_id?: string | null
          stripe_invoice_id?: string | null
          amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_ingresso: string | null
          data_nascimento: string | null
          deleted_at: string | null
          deleted_by: string | null
          endereco: string | null
          estado: string | null
          id: string
          institution_id: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          institution_id?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          institution_id?: string | null
          matricula?: string
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          action: string
          entity_type: string
          entity_id: string | null
          entity_name: string | null
          details: Json
          ip_address: string | null
          institution_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          entity_name?: string | null
          details?: Json
          ip_address?: string | null
          institution_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          entity_name?: string | null
          details?: Json
          ip_address?: string | null
          institution_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          ativo: boolean | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          duracao_semestres: number | null
          id: string
          institution_id: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          duracao_semestres?: number | null
          id?: string
          institution_id?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          duracao_semestres?: number | null
          id?: string
          institution_id?: string | null
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
          deleted_at: string | null
          deleted_by: string | null
          id: string
          institution_id: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          institution_id?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          institution_id?: string | null
          nome?: string
          professor_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
          titulo?: string
          turma_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      frequencia: {
        Row: {
          aluno_id: string
          created_at: string
          data: string
          disciplina_id: string
          id: string
          institution_id: string | null
          justificativa: string | null
          presente: boolean | null
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data: string
          disciplina_id: string
          id?: string
          institution_id?: string | null
          justificativa?: string | null
          presente?: boolean | null
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data?: string
          disciplina_id?: string
          id?: string
          institution_id?: string | null
          justificativa?: string | null
          presente?: boolean | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          id: string
          tipo: string
          aluno_id: string | null
          turma_id: string | null
          disciplina_id: string | null
          numero_validacao: string
          generated_by: string
          generated_by_name: string | null
          assinatura_digital: string | null
          metadata: Json
          institution_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo: string
          aluno_id?: string | null
          turma_id?: string | null
          disciplina_id?: string | null
          numero_validacao: string
          generated_by: string
          generated_by_name?: string | null
          assinatura_digital?: string | null
          metadata?: Json
          institution_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: string
          aluno_id?: string | null
          turma_id?: string | null
          disciplina_id?: string | null
          numero_validacao?: string
          generated_by?: string
          generated_by_name?: string | null
          assinatura_digital?: string | null
          metadata?: Json
          institution_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      horarios: {
        Row: {
          id: string
          turma_id: string
          disciplina_id: string
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          sala: string | null
          institution_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          turma_id: string
          disciplina_id: string
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          sala?: string | null
          institution_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          turma_id?: string
          disciplina_id?: string
          dia_semana?: number
          hora_inicio?: string
          hora_fim?: string
          sala?: string | null
          institution_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          aluno_id: string
          created_at: string
          data_matricula: string | null
          id: string
          institution_id: string | null
          status: string | null
          turma_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_matricula?: string | null
          id?: string
          institution_id?: string | null
          status?: string | null
          turma_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_matricula?: string | null
          id?: string
          institution_id?: string | null
          status?: string | null
          turma_id?: string
        }
        Relationships: []
      }
      notas: {
        Row: {
          aluno_id: string
          created_at: string
          disciplina_id: string
          id: string
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
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
        Relationships: []
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
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      turma_disciplinas: {
        Row: {
          id: string
          turma_id: string
          disciplina_id: string
          institution_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          turma_id: string
          disciplina_id: string
          institution_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          turma_id?: string
          disciplina_id?: string
          institution_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
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
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
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
          deleted_at: string | null
          deleted_by: string | null
          id: string
          institution_id: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          institution_id?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          institution_id?: string | null
          max_alunos?: number | null
          nome?: string
          semestre?: number | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          institution_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string | null
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
      check_institution_limit: {
        Args: { _institution_id: string; _resource: string }
        Returns: Json
      }
      get_all_institutions: {
        Args: Record<string, never>
        Returns: {
          id: string
          name: string
          slug: string
          cnpj: string
          plan_name: string
          subscription_status: string
          total_users: number
          total_alunos: number
          is_active: boolean
          created_at: string
        }[]
      }
      get_alunos_by_turma: {
        Args: { _turma_id: string }
        Returns: { aluno_id: string; aluno_nome: string; matricula: string }[]
      }
      get_institution_stats: {
        Args: { _institution_id: string }
        Returns: Json
      }
      get_platform_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      get_professor_disciplinas: {
        Args: { _professor_id: string }
        Returns: { disciplina_id: string; disciplina_nome: string; turma_id: string; turma_nome: string; curso_nome: string }[]
      }
      get_user_institution_id: {
        Args: Record<string, never>
        Returns: string
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
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_same_institution: {
        Args: { _institution_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretaria" | "professor" | "aluno" | "coordenador" | "super_admin" | "tecnico"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "secretaria", "professor", "aluno", "coordenador", "super_admin", "tecnico"],
    },
  },
} as const

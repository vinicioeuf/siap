import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string | null;
}

interface Session {
  user: User;
}

type AppRole = "admin" | "secretaria" | "professor" | "aluno" | "coordenador" | "super_admin" | "tecnico";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  institution_id: string | null;
}

interface Institution {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  is_active: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  institution: Institution | null;
  institutionId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSecretaria: boolean;
  isProfessor: boolean;
  isAluno: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string, userEmail?: string | null) => {
    try {
      let [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.rpc("get_user_roles", { _user_id: userId }),
      ]);

      if (!profileRes.data && userEmail) {
        await supabase.from("profiles").insert({
          id: userId,
          user_id: userId,
          full_name: userEmail.split("@")[0],
          email: userEmail,
          phone: null,
          avatar_url: null,
          institution_id: null,
        });
        profileRes = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      }

      if (!rolesRes.data || rolesRes.data.length === 0) {
        const totalRoles = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true });

        const initialRole: AppRole = (totalRoles.count || 0) === 0 ? "super_admin" : "aluno";
        await supabase.from("user_roles").insert({
          id: `${userId}_${initialRole}`,
          user_id: userId,
          role: initialRole,
        });
        rolesRes = await supabase.rpc("get_user_roles", { _user_id: userId });
      }

      setProfile(profileRes.data);
      setRoles((rolesRes.data as AppRole[]) || []);

      // Load institution data
      if (profileRes.data?.institution_id) {
        const { data: instData } = await supabase
          .from("institutions")
          .select("id, name, slug, logo_url, plan_id, subscription_status, is_active")
          .eq("id", profileRes.data.institution_id)
          .single();
        setInstitution(instData);
      } else {
        setInstitution(null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setProfile(null);
      setRoles([]);
      setInstitution(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          loadUserData(session.user.id, session.user.email);
        } else {
          setProfile(null);
          setRoles([]);
          setInstitution(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setInstitution(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        institution,
        institutionId: profile?.institution_id || null,
        loading,
        signIn,
        signOut,
        hasRole,
        isSuperAdmin: hasRole("super_admin"),
        isAdmin: hasRole("admin") || hasRole("super_admin"),
        isSecretaria: hasRole("secretaria"),
        isProfessor: hasRole("professor"),
        isAluno: hasRole("aluno"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

import {
  Auth,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  getCountFromServer,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, secondaryAuth, storage } from "@/lib/firebase";

type QueryFilter = { kind: "eq" | "in"; field: string; value: any };

type InvokeBody = Record<string, any>;

type SupabaseAuthResponse<T> = { data: T; error: { message: string } | null };

function nowIso() {
  return new Date().toISOString();
}

function mapUser(user: FirebaseUser | null) {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
  };
}

class FirestoreQueryBuilder implements PromiseLike<any> {
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private selectColumns = "*";
  private filters: QueryFilter[] = [];
  private sortField: string | null = null;
  private sortAscending = true;
  private maxRows: number | null = null;
  private singleRow = false;
  private head = false;
  private countMode: string | null = null;
  private payload: any = null;

  constructor(private table: string) {}

  select(columns = "*", options?: { head?: boolean; count?: string }) {
    if (this.operation === "insert") {
      this.selectColumns = columns;
      return this;
    }

    this.operation = "select";
    this.selectColumns = columns;
    this.head = Boolean(options?.head);
    this.countMode = options?.count || null;
    return this;
  }

  insert(payload: any) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ kind: "eq", field, value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ kind: "in", field, value: values });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.sortField = field;
    this.sortAscending = opts?.ascending !== false;
    return this;
  }

  limit(value: number) {
    this.maxRows = value;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  async execute() {
    switch (this.operation) {
      case "insert":
        return this.executeInsert();
      case "update":
        return this.executeUpdate();
      case "delete":
        return this.executeDelete();
      default:
        return this.executeSelect();
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  private getCollection(): CollectionReference<DocumentData> {
    return collection(db, this.table);
  }

  private buildQuery() {
    const constraints: any[] = [];

    for (const filter of this.filters) {
      if (filter.kind === "eq") constraints.push(where(filter.field, "==", filter.value));
      if (filter.kind === "in") constraints.push(where(filter.field, "in", filter.value));
    }

    if (this.sortField) {
      constraints.push(orderBy(this.sortField, this.sortAscending ? "asc" : "desc"));
    }

    if (this.maxRows) {
      constraints.push(fsLimit(this.maxRows));
    }

    return constraints.length ? query(this.getCollection(), ...constraints) : this.getCollection();
  }

  private async executeSelect() {
    try {
      const q = this.buildQuery();
      const snapshot = await getDocs(q);
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const enriched = await this.enrichRows(rows);

      let count: number | null = null;
      if (this.countMode === "exact") {
        const countQuery = this.filters.length ? query(this.getCollection(), ...this.filters.map((f) => f.kind === "eq" ? where(f.field, "==", f.value) : where(f.field, "in", f.value))) : this.getCollection();
        const countSnap = await getCountFromServer(countQuery as any);
        count = countSnap.data().count;
      }

      if (this.head) {
        return { data: null, error: null, count };
      }

      if (this.singleRow) {
        const row = enriched[0] || null;
        if (!row) {
          return { data: null, error: { message: "Registro não encontrado" } };
        }
        return { data: row, error: null };
      }

      return { data: enriched, error: null, count };
    } catch (error: any) {
      return { data: this.singleRow ? null : [], error: { message: error.message || "Erro ao consultar dados" } };
    }
  }

  private async executeInsert() {
    try {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: any[] = [];

      for (const item of items) {
        const payload = { ...item };
        if (!payload.created_at) payload.created_at = nowIso();
        payload.updated_at = nowIso();

        if (payload.id) {
          await setDoc(doc(db, this.table, String(payload.id)), payload, { merge: true });
          inserted.push(payload);
          continue;
        }

        const refDoc = await addDoc(this.getCollection(), payload);
        inserted.push({ id: refDoc.id, ...payload });
      }

      if (this.singleRow) {
        const row = inserted[0] || null;
        if (!row) {
          return { data: null, error: { message: "Registro não encontrado" } };
        }
        return { data: row, error: null };
      }

      return { data: inserted, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || "Erro ao inserir" } };
    }
  }

  private async executeUpdate() {
    try {
      const q = this.buildQuery();
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { ...this.payload, updated_at: nowIso() });
      });

      await batch.commit();
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || "Erro ao atualizar" } };
    }
  }

  private async executeDelete() {
    try {
      const q = this.buildQuery();
      const snapshot = await getDocs(q);
      const deletions = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || "Erro ao remover" } };
    }
  }

  private async enrichRows(rows: any[]) {
    if (!rows.length) return rows;

    // Basic relation compatibility for existing screens.
    if ((this.table === "turmas" || this.table === "disciplinas") && this.selectColumns.includes("cursos(")) {
      const cursoIds = Array.from(new Set(rows.map((r) => r.curso_id).filter(Boolean)));
      if (!cursoIds.length) return rows;

      const cursosSnap = await getDocs(query(collection(db, "cursos"), where("id", "in", cursoIds.slice(0, 10))));
      const cursoMap = new Map<string, any>();
      cursosSnap.docs.forEach((d) => cursoMap.set(d.data().id || d.id, { id: d.id, ...d.data() }));

      return rows.map((row) => ({
        ...row,
        cursos: row.curso_id ? cursoMap.get(row.curso_id) || null : null,
      }));
    }

    if (this.table === "subscriptions" && this.selectColumns.includes("plans(")) {
      const planIds = Array.from(new Set(rows.map((r) => r.plan_id).filter(Boolean)));
      if (!planIds.length) return rows;

      const plansSnap = await getDocs(query(collection(db, "plans"), where("id", "in", planIds.slice(0, 10))));
      const planMap = new Map<string, any>();
      plansSnap.docs.forEach((d) => planMap.set(d.data().id || d.id, { id: d.id, ...d.data() }));

      return rows.map((row) => ({
        ...row,
        plans: row.plan_id ? planMap.get(row.plan_id) || null : null,
      }));
    }

    return rows;
  }
}

function buildAuthFacade(sourceAuth: Auth) {
  return {
    onAuthStateChange(callback: (event: string, session: any) => void) {
      const unsubscribe = onAuthStateChanged(sourceAuth, (user) => {
        callback(user ? "SIGNED_IN" : "SIGNED_OUT", user ? { user: mapUser(user) } : null);
      });
      return { data: { subscription: { unsubscribe } } };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }): Promise<SupabaseAuthResponse<any>> {
      try {
        const cred = await signInWithEmailAndPassword(sourceAuth, email, password);
        return { data: { user: mapUser(cred.user), session: { user: mapUser(cred.user) } }, error: null };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: { message: error.message || "Falha ao autenticar" } };
      }
    },

    async signUp({ email, password }: { email: string; password: string }): Promise<SupabaseAuthResponse<any>> {
      try {
        const cred = await createUserWithEmailAndPassword(sourceAuth, email, password);
        return { data: { user: mapUser(cred.user), session: { user: mapUser(cred.user) } }, error: null };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: { message: error.message || "Falha ao criar usuário" } };
      }
    },

    async signOut(): Promise<SupabaseAuthResponse<any>> {
      try {
        await firebaseSignOut(sourceAuth);
        return { data: {}, error: null };
      } catch (error: any) {
        return { data: {}, error: { message: error.message || "Falha ao sair" } };
      }
    },

    async getUser(): Promise<SupabaseAuthResponse<any>> {
      const user = sourceAuth.currentUser;
      return { data: { user: mapUser(user) }, error: null };
    },
  };
}

async function invokeCreateUser(body: InvokeBody) {
  try {
    const signUp = await buildAuthFacade(secondaryAuth).signUp({
      email: body.email,
      password: body.password,
    });

    if (signUp.error || !signUp.data.user) {
      return { data: null, error: signUp.error || { message: "Falha ao criar usuário" } };
    }

    const userId = signUp.data.user.id;

    await setDoc(doc(db, "profiles", userId), {
      id: userId,
      user_id: userId,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone || null,
      institution_id: body.institution_id || null,
      avatar_url: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }, { merge: true });

    const role = body.role || "aluno";
    await setDoc(doc(db, "user_roles", `${userId}_${role}`), {
      id: `${userId}_${role}`,
      user_id: userId,
      role,
      institution_id: body.institution_id || null,
      created_at: nowIso(),
    }, { merge: true });

    await buildAuthFacade(secondaryAuth).signOut();

    return {
      data: {
        user: {
          id: userId,
          email: body.email,
        },
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: { message: error.message || "Erro ao criar usuário" } };
  }
}

async function invokeCreateInstitution(body: InvokeBody) {
  try {
    const institutionId = crypto.randomUUID();
    await setDoc(doc(db, "institutions", institutionId), {
      id: institutionId,
      name: body.institution_name,
      slug: body.institution_slug,
      cnpj: body.institution_cnpj || null,
      phone: body.institution_phone || null,
      email: body.institution_email || null,
      address: body.institution_address || null,
      plan_id: body.plan_id || null,
      is_active: true,
      subscription_status: "active",
      created_at: nowIso(),
      updated_at: nowIso(),
    }, { merge: true });

    const userResult = await invokeCreateUser({
      email: body.admin_email,
      password: body.admin_password,
      full_name: body.admin_name,
      role: "admin",
      institution_id: institutionId,
    });

    if (userResult.error) {
      return { data: null, error: userResult.error };
    }

    return {
      data: {
        institution: { id: institutionId, name: body.institution_name, slug: body.institution_slug },
        admin: userResult.data?.user || null,
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: { message: error.message || "Erro ao criar instituição" } };
  }
}

export const supabase = {
  auth: buildAuthFacade(auth),

  from(table: string) {
    return new FirestoreQueryBuilder(table);
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File | Blob) {
          try {
            const storageRef = ref(storage, `${bucket}/${path}`);
            await uploadBytes(storageRef, file);
            return { data: { path }, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message || "Erro no upload" } };
          }
        },

        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(`${bucket}/${path}`)}?alt=media`,
            },
          };
        },

        async getSignedUrl(path: string) {
          try {
            const url = await getDownloadURL(ref(storage, `${bucket}/${path}`));
            return { data: { signedUrl: url }, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message || "Erro ao obter URL" } };
          }
        },
      };
    },
  },

  rpc(name: string, params: Record<string, any>) {
    if (name === "get_user_roles") {
      const userId = params._user_id;
      return {
        then: async (resolve: any) => {
          const res = await new FirestoreQueryBuilder("user_roles").select("role").eq("user_id", userId);
          const roles = (res.data || []).map((r: any) => r.role);
          resolve({ data: roles, error: null });
        },
      } as PromiseLike<any>;
    }

    if (name === "can_hard_delete_curso") {
      const cursoId = params._curso_id;
      return {
        then: async (resolve: any) => {
          const turmas = await new FirestoreQueryBuilder("turmas").select("id").eq("curso_id", cursoId);
          const disciplinas = await new FirestoreQueryBuilder("disciplinas").select("id").eq("curso_id", cursoId);
          const canDelete = (turmas.data?.length || 0) === 0 && (disciplinas.data?.length || 0) === 0;
          resolve({ data: canDelete, error: null });
        },
      } as PromiseLike<any>;
    }

    return Promise.resolve({ data: null, error: { message: `RPC não implementada: ${name}` } });
  },

  functions: {
    async invoke(name: string, opts: { body: InvokeBody }) {
      if (name === "create-user") return invokeCreateUser(opts.body);
      if (name === "create-institution") return invokeCreateInstitution(opts.body);
      return { data: null, error: { message: `Function não implementada: ${name}` } };
    },
  },
};

export const supabaseAuth = {
  auth: buildAuthFacade(secondaryAuth),
};

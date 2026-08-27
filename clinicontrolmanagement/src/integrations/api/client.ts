/**
 * Cliente HTTP REST para el backend local (Spring Boot + PostgreSQL)
 * Maneja autenticación JWT, queries REST y funciones del servidor.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Dev-only logger. Vite statically replaces `import.meta.env.DEV` at build
 * time, so in production this whole branch (and the string template
 * arguments) is dead-code-eliminated — no console I/O overhead on every
 * request, and no risk of leaking partial tokens/URLs to the browser console.
 */
function debugLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

/** Decode JWT payload without verification (client-side only) */
function decodeJwtPayload(token: string): any | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    return JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** Build a minimal AuthUser from the JWT payload stored in localStorage */
function userFromToken(token: string): AuthUser | null {
  const p = decodeJwtPayload(token);
  if (!p || !p.sub) return null;
  // Check expiry
  if (p.exp && p.exp * 1000 < Date.now()) return null;
  return {
    id: p.sub,
    email: p.email ?? "",
    app_metadata: { clinic_id: p.clinic_id ?? null, role: p.role ?? "clinico" },
  };
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  in: (column: string, values: any[]) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => Promise<{ data: any; error: any }>;
  single: () => Promise<{ data: any; error: any }>;
  execute: () => Promise<{ data: any; error: any }>;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
  app_metadata?: any;
}

export interface Session {
  access_token: string;
  token_type: string;
  user?: AuthUser;
}

interface Table {
  select: (columns?: string) => QueryBuilder;
  insert: (data: any) => {
    select: () => {
      single: () => Promise<{ data: any; error: any }>;
    };
  };
  update: (updates: any) => {
    eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
  };
  delete: () => {
    eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
  };
}

class QueryBuilderImpl implements QueryBuilder {
  private table: string;
  private columns: string = "*";
  private filters: Array<{ type: string; column: string; value: any }> = [];
  private orderColumn?: string;
  private orderAscending: boolean = true;
  private limitCount?: number;
  private _maybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string): QueryBuilder {
    this.columns = columns || "*";
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, values: any[]): QueryBuilder {
    this.filters.push({ type: "in", column, value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this.orderColumn = column;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  // Make QueryBuilder thenable so `await builder` auto-executes
  then(resolve: (value: { data: any; error: any }) => any, reject?: (reason: any) => any): Promise<any> {
    return this.execute().then(resolve, reject);
  }

  maybeSingle(): Promise<{ data: any; error: any }> {
    this._maybeSingle = true;
    return this.execute().then((result) => {
      if (result.error) return result;
      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        return { data: null, error: null };
      }
      return { data: Array.isArray(result.data) ? result.data[0] : result.data, error: null };
    });
  }

  single(): Promise<{ data: any; error: any }> {
    return this.execute().then((result) => {
      if (result.error) return result;
      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        return { data: null, error: null };
      }
      return { data: Array.isArray(result.data) ? result.data[0] : result.data, error: null };
    });
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        debugLog(`🔑 Using token for ${this.table} query`);
      } else {
        debugLog(`⚠️ No token found for ${this.table} query`);
      }

      // If the only eq filter is on "id", use the /{id} endpoint directly
      const idFilter = this.filters.find(f => f.type === "eq" && f.column === "id");
      const otherFilters = this.filters.filter(f => !(f.type === "eq" && f.column === "id"));

      let url: string;
      if (idFilter && otherFilters.length === 0) {
        // Direct lookup by id
        url = `${API_URL}/rest/v1/${this.table}/${idFilter.value}`;
      } else {
        url = `${API_URL}/rest/v1/${this.table}?select=${encodeURIComponent(this.columns)}`;

        // Agregar filtros (excluding id which was handled above)
        const filtersToApply = idFilter ? otherFilters : this.filters;
        for (const filter of filtersToApply) {
          if (filter.type === "eq") {
            url += `&${filter.column}=eq.${encodeURIComponent(filter.value)}`;
          } else if (filter.type === "in") {
            url += `&${filter.column}=in.(${filter.value.map((v: any) => encodeURIComponent(v)).join(",")})`;
          }
        }

        // Agregar ordenamiento
        if (this.orderColumn) {
          const order = this.orderAscending ? "asc" : "desc";
          url += `&order=${this.orderColumn}.${order}`;
        }

        // Agregar límite
        if (this.limitCount) {
          url += `&limit=${this.limitCount}`;
        }
      }

      debugLog(`📤 GET ${this.table}:`, url);

      const response = await fetch(url, { headers });

      debugLog(`📥 ${this.table} response:`, response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ ${this.table} error:`, error);
        return { data: null, error };
      }

      const result = await response.json();
      const data = result.data || result;

      if (this._maybeSingle && Array.isArray(data) && data.length === 0) {
        return { data: null, error: null };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error(`💥 ${this.table} exception:`, error);
      return { data: null, error: { message: error.message } };
    }
  }
}

class TableImpl implements Table {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string): QueryBuilder {
    const builder = new QueryBuilderImpl(this.table);
    return builder.select(columns);
  }

  insert(data: any) {
    const table = this.table;
    const doInsert = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        debugLog(`📤 INSERT ${table}`);
        const response = await fetch(`${API_URL}/rest/v1/${table}`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const text = await response.text();
          let error;
          try {
            error = text ? JSON.parse(text) : { message: `Server error: ${response.status}` };
          } catch {
            error = { message: text || `Server error: ${response.status}` };
          }
          return { data: null, error };
        }

        const result = await response.json();
        const resultData = result.data || result;
        return { data: resultData, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    };

    // Return a thenable that also supports .select().single()
    const promise = doInsert();
    return {
      then: (resolve: any, reject?: any) => promise.then(resolve, reject),
      catch: (reject: any) => promise.catch(reject),
      select: () => ({
        single: () => promise,
      }),
    };
  }

  update(updates: any) {
    const table = this.table;
    return {
      eq: (column: string, value: any) => {
        const doUpdate = async () => {
          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };

          const response = await fetch(`${API_URL}/rest/v1/${table}/${value}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const text = await response.text();
            let error;
            try {
              error = text ? JSON.parse(text) : { message: `Server error: ${response.status}` };
            } catch {
              error = { message: text || `Server error: ${response.status}` };
            }
            return { data: null, error };
          }

          const result = await response.json();
          const data = result.data || result;
          return { data, error: null };
        };

        const promise = doUpdate();
        return {
          then: (resolve: any, reject?: any) => promise.then(resolve, reject),
          catch: (reject: any) => promise.catch(reject),
          select: () => ({
            single: () => promise,
          }),
        };
      },
    };
  }

  delete() {
    return {
      eq: async (column: string, value: any) => {
        try {
          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
          };

          const response = await fetch(`${API_URL}/rest/v1/${this.table}/${value}`, {
            method: "DELETE",
            headers,
          });

          if (!response.ok) {
            const text = await response.text();
            let error;
            try {
              const parsed = JSON.parse(text);
              error = { message: parsed.error || parsed.message || text };
            } catch {
              error = { message: text || `Server error: ${response.status}` };
            }
            return { data: null, error };
          }

          return { data: {}, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },
    };
  }
}

class ApiClient {
  private currentUser: AuthUser | null = null;
  private currentSession: Session | null = null;
  private authStateListeners: Set<(event: string, session: Session | null) => void> = new Set();

  auth = {
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      const token = localStorage.getItem("auth_token");
      
      // Llamar inmediatamente con estado actual
      if (token) {
        const user = this.currentUser || userFromToken(token);
        if (user) {
          this.currentUser = user;
          callback("SIGNED_IN", { access_token: token, token_type: "bearer", user });
        } else {
          // Token expired
          localStorage.removeItem("auth_token");
          callback("SIGNED_OUT", null);
        }
      } else {
        callback("SIGNED_OUT", null);
      }

      // Agregar listener
      this.authStateListeners.add(callback);

      // Escuchar cambios en localStorage
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "auth_token") {
          if (e.newValue) {
            callback("SIGNED_IN", { access_token: e.newValue, token_type: "bearer", user: this.currentUser || undefined });
          } else {
            callback("SIGNED_OUT", null);
          }
        }
      };

      window.addEventListener("storage", handleStorageChange);

      // Retornar objeto de suscripción con método unsubscribe
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authStateListeners.delete(callback);
              window.removeEventListener("storage", handleStorageChange);
            },
          },
        },
      };
    },

    getUser: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return { data: { user: null }, error: null };

      try {
        debugLog("🔄 Calling GET /auth/v1/user endpoint...");
        const response = await fetch(`${API_URL}/auth/v1/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.error("❌ GET /auth/v1/user failed with status:", response.status);
          return { data: { user: null }, error: null };
        }

        // Backend returns { user, profile, role }
        const backendResponse = await response.json();
        debugLog("📦 Backend response received:", {
          user: backendResponse.user?.id,
          profile: backendResponse.profile?.first_name,
          role: backendResponse.role,
        });

        const user = {
          id: backendResponse.user?.id,
          email: backendResponse.user?.email,
          user_metadata: {
            first_name: backendResponse.profile?.first_name,
            last_name: backendResponse.profile?.last_name,
            identification: backendResponse.profile?.identification,
            phone: backendResponse.profile?.phone,
            username: backendResponse.profile?.username,
            is_active: backendResponse.profile?.is_active,
          },
          app_metadata: {
            clinic_id: backendResponse.profile?.clinic_id,
            role: backendResponse.role,
          },
        };

        this.currentUser = user;
        debugLog("✅ User transformed and stored");
        return { data: { user }, error: null };
      } catch (error) {
        console.error("💥 Exception in getUser:", error);
        return { data: { user: null }, error: null };
      }
    },

    getSession: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return { data: { session: null }, error: null };

      const user = this.currentUser || userFromToken(token);
      if (!user) {
        // Token expired – clean up
        localStorage.removeItem("auth_token");
        return { data: { session: null }, error: null };
      }
      this.currentUser = user;
      return { data: { session: { access_token: token, token_type: "bearer", user } }, error: null };
    },

    signUp: async (credentials: { email: string; password: string; options?: any; [key: string]: any }) => {
      try {
        const userData = credentials.options?.data || credentials;
        
        const payload = {
          email: credentials.email,
          password: credentials.password,
          firstName: userData.firstName || credentials.firstName,
          lastName: userData.lastName || credentials.lastName,
          clinicName: userData.clinicName || credentials.clinicName,
          clinicNit: userData.clinicNit || credentials.clinicNit,
          clinicAddress: userData.clinicAddress || credentials.clinicAddress,
          clinicPhone: userData.clinicPhone || credentials.clinicPhone,
          clinicCodPrestador: userData.clinicCodPrestador || credentials.clinicCodPrestador,
        };

        debugLog("📤 Sending signUp request to", `${API_URL}/auth/v1/sign-up`, payload);

        const response = await fetch(`${API_URL}/auth/v1/sign-up`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        debugLog("📥 Response status:", response.status, response.statusText);

        if (!response.ok) {
          const text = await response.text();
          let error;
          try {
            error = text ? JSON.parse(text) : { message: `Server error: ${response.status} ${response.statusText}` };
          } catch {
            error = { message: text || `Server error: ${response.status} ${response.statusText}` };
          }
          console.error("❌ Sign-up error response:", error);
          return { data: null, error };
        }

        const result = await response.json();
        debugLog("✅ Sign-up successful response:", { user: result.user?.id, session: result.session?.access_token?.substring(0, 20) });

        localStorage.setItem("auth_token", result.session.access_token);
        this.currentUser = result.user;
        this.currentSession = result.session;

        const sessionWithUser = {
          ...result.session,
          user: result.user,
        };

        // Notificar a listeners
        this.authStateListeners.forEach((listener) => {
          listener("SIGNED_IN", sessionWithUser);
        });

        return { 
          data: {
            user: result.user,
            session: sessionWithUser,
          }, 
          error: null 
        };
      } catch (error: any) {
        console.error("💥 Sign-up exception:", error);
        return { data: null, error: { message: error.message } };
      }
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        debugLog("📤 Sending signIn request to", `${API_URL}/auth/v1/sign-in`, { email: credentials.email });

        const response = await fetch(`${API_URL}/auth/v1/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        debugLog("📥 Sign-in response status:", response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error("❌ Sign-in error:", error);
          return { data: null, error };
        }

        const result = await response.json();
        debugLog("✅ Sign-in successful response:", { user: result.user, session: result.session });

        localStorage.setItem("auth_token", result.session.access_token);
        this.currentUser = result.user;
        this.currentSession = result.session;

        const sessionWithUser = {
          ...result.session,
          user: result.user,
        };

        debugLog("📋 Session object being returned:", { user: sessionWithUser.user?.id, token: sessionWithUser.access_token?.substring(0, 20) });

        // Notificar a listeners
        this.authStateListeners.forEach((listener) => {
          listener("SIGNED_IN", sessionWithUser);
        });

        return { 
          data: {
            user: result.user,
            session: sessionWithUser,
          }, 
          error: null 
        };
      } catch (error: any) {
        console.error("💥 Sign-in exception:", error);
        return { data: null, error: { message: error.message } };
      }
    },

    signOut: async () => {
      try {
        const token = localStorage.getItem("auth_token");
        await fetch(`${API_URL}/auth/v1/sign-out`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        localStorage.removeItem("auth_token");
        this.currentUser = null;
        this.currentSession = null;

        // Notificar a listeners
        this.authStateListeners.forEach((listener) => {
          listener("SIGNED_OUT", null);
        });

        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    },
  };

  functions = {
    invoke: async (functionName: string, options?: { body?: any }) => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${API_URL}/functions/v1/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options?.body || {}),
        });

        if (!response.ok) {
          const error = await response.json();
          return { data: null, error: { message: error.error || "Function call failed" } };
        }

        const result = await response.json();
        return { data: result, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
  };

  from(table: string): Table {
    return new TableImpl(table);
  }
}

export const api = new ApiClient();

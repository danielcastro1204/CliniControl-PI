import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/integrations/api";
import type { AuthUser as User, Session } from "@/integrations/api";

/** Dev-only logger — stripped from the production build, see integrations/api/client.ts */
function debugLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export type AppRole = "admin" | "clinico" | "system_admin";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  clinic_id: string | null;
  identification: string | null;
  phone: string | null;
  username: string | null;
  is_active: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
  clinicNit?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicCodPrestador?: string;
}

interface AuthHydrationResult {
  profile: Profile | null;
  role: AppRole | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const hydrationRequestRef = useRef(0);

  const fetchProfileAndRole = useCallback(async (userId: string): Promise<AuthHydrationResult> => {
    try {
      debugLog("📊 Fetching profile and role for user:", userId);
      
      // Call getUser to get the full user info including profile
      const userResponse = await api.auth.getUser();
      
      if (userResponse.error) {
        console.error("❌ Error fetching user:", userResponse.error);
        return { profile: null, role: null };
      }

      const userData = userResponse.data?.user;
      if (!userData) {
        console.error("❌ No user data returned");
        return { profile: null, role: null };
      }

      debugLog("📋 User data received:", { id: userData.id, metadata: userData.user_metadata, app_metadata: userData.app_metadata });

      // Create profile object from user data
      const profile: Profile = {
        id: userData.id,
        first_name: userData.user_metadata?.first_name || userData.user_metadata?.nama || "",
        last_name: userData.user_metadata?.last_name || "",
        clinic_id: userData.app_metadata?.clinic_id || null,
        identification: userData.user_metadata?.identification || null,
        phone: userData.user_metadata?.phone || null,
        username: userData.user_metadata?.username || null,
        is_active: userData.user_metadata?.is_active !== false,
      };

      const role = (userData.app_metadata?.role as AppRole) || "clinico";

      debugLog("✅ Profile and role extracted:", { profile: profile.id, first_name: profile.first_name, role });

      return {
        profile,
        role,
      };
    } catch (err) {
      console.error("💥 Exception fetching auth context:", err);
      return { profile: null, role: null };
    }
  }, []);

  const hydrateAuthState = useCallback(async (nextSession: Session | null) => {
    const requestId = ++hydrationRequestRef.current;

    debugLog("🔄 Hydrating auth state with session:", nextSession?.user?.id);
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      debugLog("⚪ No user in session, clearing auth state");
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { profile: nextProfile, role: nextRole } = await fetchProfileAndRole(nextSession.user.id);

      if (requestId !== hydrationRequestRef.current) {
        debugLog("⚠️ Hydration request cancelled (newer request exists)");
        return;
      }

      debugLog("✅ Auth state hydrated:", { profile: nextProfile?.id, role: nextRole });
      setProfile(nextProfile);
      setRole(nextRole);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error hydrating auth state:", error);
      setLoading(false);
    }
  }, [fetchProfileAndRole]);

  useEffect(() => {
    const { data: { subscription } } = api.auth.onAuthStateChange(
      (_event, session) => {
        void hydrateAuthState(session);
      }
    );

    void api.auth.getSession().then(({ data: { session } }) => {
      void hydrateAuthState(session);
    });

    return () => {
      hydrationRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [hydrateAuthState]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      debugLog("🔐 Attempting login for email:", email);
      const { data, error } = await api.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("❌ Login error:", error);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (!data || !data.session) {
        console.error("❌ No session in login response:", data);
        setLoading(false);
        return { success: false, error: "No session data" };
      }

      debugLog("✅ Login successful, session:", { user: data.session.user?.id, token: data.session.access_token?.substring(0, 20) });
      
      // Wait for hydrateAuthState to complete
      await hydrateAuthState(data.session);
      debugLog("✅ Auth state hydration complete, ready to navigate");
      return { success: true };
    } catch (error) {
      console.error("💥 Login exception:", error);
      setLoading(false);
      return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
    }
  }, [hydrateAuthState]);

  const logout = useCallback(async () => {
    hydrationRequestRef.current += 1;
    await api.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setLoading(false);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);

    try {
      // Sign up user with all clinic data
      const { data: authData, error: signUpError } = await api.auth.signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        clinicName: data.clinicName,
        clinicNit: data.clinicNit,
        clinicAddress: data.clinicAddress,
        clinicPhone: data.clinicPhone,
        clinicCodPrestador: data.clinicCodPrestador,
      });

      if (signUpError) {
        setLoading(false);
        console.error("Sign up error:", signUpError);
        return { success: false, error: signUpError.message };
      }

      if (!authData || !authData.session) {
        setLoading(false);
        console.error("No session in response:", authData);
        return { success: false, error: "Error en la sesión" };
      }

      debugLog("✅ Sign up successful, session:", { userId: authData.session.user?.id, token: authData.session.access_token?.substring(0, 20) });

      // hydrateAuthState espera el session object que ya debe tener el user
      await hydrateAuthState(authData.session);
      debugLog("✅ Registration complete, auth state hydrated");
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Register exception:", error);
      return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
    }
  }, [hydrateAuthState]);

  const isAuthenticated = !!session && !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, session, profile, role, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session ?? null);
        setSessionReady(true);
      })
      .catch(() => { if (alive) setSessionReady(true); });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!sessionReady) return undefined;
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return undefined;
    }
    let alive = true;
    setProfileReady(false);
    supabase.from("profiles").select("id, email, full_name, role").eq("id", userId).maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setProfile(data ?? null);
        setProfileReady(true);
      })
      .catch(() => { if (alive) setProfileReady(true); });
    return () => { alive = false; };
  }, [sessionReady, userId]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === "admin",
      loading: !sessionReady || !profileReady,
      signIn,
      signOut,
    }),
    [session, profile, sessionReady, profileReady, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

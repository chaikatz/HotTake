import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { fetchMyProfile } from "@/api/auth";
import type { Profile } from "@/types/db";

interface SessionState {
  /** undefined while the saved session is being restored at launch. */
  session: Session | null | undefined;
  /** The member's profile; null when signed out or not finished joining. */
  profile: Profile | null;
  profileLoaded: boolean;
  refreshProfile: () => Promise<Profile | null>;
  setProfile: (p: Profile | null) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await fetchMyProfile();
      setProfile(p);
      return p;
    } catch {
      return null;
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session) void refreshProfile();
      else setProfileLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT" || !next) {
        setProfile(null);
        setProfileLoaded(true);
        queryClient.clear();
      } else if (event === "SIGNED_IN") {
        setProfileLoaded(false);
        void refreshProfile();
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    queryClient.clear();
  }, []);

  const value = useMemo<SessionState>(
    () => ({ session, profile, profileLoaded, refreshProfile, setProfile, signOut }),
    [session, profile, profileLoaded, refreshProfile, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

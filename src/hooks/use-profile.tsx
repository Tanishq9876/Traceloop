import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/learning.functions";
import { useAuth } from "@/hooks/use-auth";

export type Profile = {
  display_name: string | null;
  preferred_mode: string;
  preferred_language: string;
};

type Ctx = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: Profile) => void;
};

const ProfileContext = React.createContext<Ctx>({
  profile: null,
  loading: true,
  refresh: async () => {},
  setProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const getProfileFn = useServerFn(getProfile);

  const refresh = React.useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const { profile: p } = await getProfileFn();
      if (p) {
        setProfile({
          display_name: p.display_name ?? null,
          preferred_mode: p.preferred_mode ?? "intermediate",
          preferred_language: p.preferred_language ?? "python",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, getProfileFn]);

  React.useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return React.useContext(ProfileContext);
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

/** Fetch all profiles (useful for admin views that need to map rep_id to name). */
export function useAllProfiles(enabled = true) {
  return useQuery({
    queryKey: ["all-profiles"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,display_name,email");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

/** Build a lookup map from the profiles array. */
export function buildProfileMap(profiles: Profile[]) {
  return new Map<string, Profile>(profiles.map((p) => [p.user_id, p]));
}

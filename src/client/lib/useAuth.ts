import { useQuery } from "@tanstack/react-query";
import { api } from "@/client/lib/api";

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ authed: boolean }>("/api/me"),
  });
  return { authed: Boolean(data?.authed), isLoading };
}

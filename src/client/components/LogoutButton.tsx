import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

export default function LogoutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
    >
      Uitloggen
    </button>
  );
}

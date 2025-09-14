// src/components/RequireAuth.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getToken, clearAuth } from "@/pages/api/api";

export default function RequireAuth({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth");
    }
  }, [router]);

  return <>{children}</>;
}

// Optional helper you can import where needed:
export function LogoutButton() {
  const router = useRouter();
  const onLogout = () => {
    clearAuth();
    router.push("/auth");
  };
  return (
    <button
      onClick={onLogout}
      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
    >
      Logout
    </button>
  );
}

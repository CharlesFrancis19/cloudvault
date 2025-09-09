// src/components/RequireAuth.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getToken } from "../pages/api/api";

export default function RequireAuth({ children }) {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) router.replace("/");
  }, [router]);
  return children;
}

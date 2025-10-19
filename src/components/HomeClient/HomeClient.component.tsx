"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import { useAuth } from "src/context/auth.context";

export default function HomeClient() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace("/releases");
    }
  }, [state.isAuthenticated, router]);

  if (state.isLoading) {
    return <AuthLoading />;
  }

  return <Login />;
}

"use client";

import { redirect } from "next/navigation";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import { useAuth } from "src/context/auth.context";

export default function HomeClient() {
  const { state } = useAuth();

  if (state.isLoading) {
    return <AuthLoading />;
  }

  if (state.isAuthenticated) {
    redirect("/releases");
  }

  return <Login />;
}

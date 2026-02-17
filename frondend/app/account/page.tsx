"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Account() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage before redirecting
    if (!_hasHydrated) {
      console.log("🔵 Account: Waiting for hydration...");
      return;
    }

    console.log("🔵 Account: Hydration complete, checking auth", { isAuthenticated });

    if (isAuthenticated) {
      console.log("🔵 Account: Redirecting to dashboard");
      router.push("/account/dashboard");
    } else {
      console.log("🔵 Account: Redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  return (
    
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">
          {!_hasHydrated ? "Loading..." : "Redirecting..."}
        </p>
      </div>
    
  );
}

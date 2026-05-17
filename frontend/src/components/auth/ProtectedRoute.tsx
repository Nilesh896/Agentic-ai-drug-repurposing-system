"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const { token, hydrated } =
        useAuthStore();

    useEffect(() => {
        if (
            hydrated &&
            !token
        ) {
            router.push("/login");
        }
    }, [
        token,
        hydrated,
        router,
    ]);

    if (!hydrated) {
        return null;
    }

    if (!token) {
        return null;
    }

    return <>{children}</>;
}
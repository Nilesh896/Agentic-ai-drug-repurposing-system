"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";
import { validateSession } from "@/services/auth.service";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const { token, hydrated, sessionValidated, setSessionValidated, logout } =
        useAuthStore();

    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const verifySession = async () => {
            if (hydrated) {
                if (!token) {
                    router.push("/login");
                } else {
                    if (sessionValidated) {
                        return;
                    }

                    try {
                        setVerifying(true);
                        const response = await validateSession(token);
                        if (response.success) {
                            setSessionValidated(true);
                        } else {
                            logout();
                            router.push("/login");
                        }
                    } catch (error) {
                        logout();
                        router.push("/login");
                    } finally {
                        setVerifying(false);
                    }
                }
            }
        };

        verifySession();
    }, [
        token,
        hydrated,
        sessionValidated,
        router,
        logout,
        setSessionValidated,
    ]);

    if (!hydrated || verifying) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-zinc-700 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return null;
    }

    return <>{children}</>;
}
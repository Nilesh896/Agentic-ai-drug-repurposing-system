"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { validateSession } from "@/services/auth.service";

export default function Home() {
    const router = useRouter();
    const { token, hydrated, sessionValidated, setSessionValidated, logout } = useAuthStore();
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const verifyAndRoute = async () => {
            if (hydrated) {
                if (token) {
                    if (sessionValidated) {
                        router.push("/dashboard");
                        return;
                    }

                    try {
                        setVerifying(true);
                        const response = await validateSession(token);
                        if (response.success) {
                            setSessionValidated(true);
                            router.push("/dashboard");
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
                } else {
                    router.push("/login");
                }
            }
        };

        verifyAndRoute();
    }, [token, hydrated, sessionValidated, router, logout, setSessionValidated]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-sm font-medium">
                    {verifying ? "Verifying session..." : "Loading session..."}
                </p>
            </div>
        </div>
    );
}

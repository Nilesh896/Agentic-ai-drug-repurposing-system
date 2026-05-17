"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";

export default function Sidebar() {
    const router = useRouter();

    const logout =
        useAuthStore(
            (state) => state.logout
        );

    const handleLogout = () => {
        logout();

        router.push("/login");
    };

    return (
        <div className="w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 p-6">
            <h1 className="text-2xl font-bold text-white mb-10">
                AI Pharma
            </h1>

            <nav className="space-y-4">
                <Link
                    href="/dashboard"
                    className="block text-zinc-300 hover:text-white transition"
                >
                    Dashboard
                </Link>

                <Link
                    href="/history"
                    className="block text-zinc-300 hover:text-white transition"
                >
                    Research History
                </Link>

                <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 transition"
                >
                    Logout
                </button>
            </nav>
        </div>
    );
}
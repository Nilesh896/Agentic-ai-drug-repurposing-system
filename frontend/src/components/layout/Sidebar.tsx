"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
        {
            name: "Research History",
            href: "/history",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    return (
        <aside className="w-64 min-h-screen bg-zinc-950/90 border-r border-zinc-900/80 p-6 flex flex-col justify-between backdrop-blur-sm shrink-0">
            <div>
                {/* Branding */}
                <div className="flex items-center gap-3 mb-8 px-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
                        AP
                    </span>
                    <div>
                        <span className="text-base font-bold tracking-tight text-white block leading-none">
                            AI Pharma
                        </span>
                        <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono mt-1 block">
                            Research Suite
                        </span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Workspace
                    </div>
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith("/history");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                                    isActive
                                        ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
                                }`}
                            >
                                <span className={isActive ? "text-indigo-400" : "text-zinc-500"}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User & Logout Section */}
            <div className="pt-5 border-t border-zinc-900/80 space-y-3">
                {user && (
                    <div className="px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-900">
                        <p className="text-xs font-medium text-zinc-200 truncate">Researcher</p>
                        <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent transition duration-150 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
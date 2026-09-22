"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import { loginUser } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import BiomedicalHelixBackground from "@/components/auth/BiomedicalHelixBackground";

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }
        if (!password) {
            toast.error("Password is required");
            return;
        }

        try {
            setLoading(true);
            const response = await loginUser(email, password);

            if (response.success) {
                const user = response.data.user;
                const token = response.data.token;

                setAuth(user, token);
                toast.success("Login successful");
                router.push("/dashboard");
            } else {
                toast.error(response.message || "Login failed");
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Login failed. Please check credentials.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
            {/* Left Column: 3D Biomedical Hero & Branding Section */}
            <div className="relative overflow-hidden flex-1 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800/80 p-8 md:p-16 flex flex-col justify-between min-h-[480px] md:min-h-screen">
                {/* 3D Molecular / DNA Canvas Visual */}
                <BiomedicalHelixBackground />

                {/* Subtle dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                {/* Header / Logo */}
                <div className="relative z-10 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-indigo-500/30">
                        AP
                    </span>
                    <span className="text-xl font-bold tracking-tight text-white">AI Pharma</span>
                </div>

                {/* Central Branding Content */}
                <div className="relative z-10 my-auto py-12 md:py-0 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-5 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        AI-powered biomedical research
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                        AI Drug Repurposing <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300">
                            Research Platform
                        </span>
                    </h1>

                    <p className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-lg">
                        Accelerate pharmaceutical discoveries by using intelligent agents to automate research across medical literature, clinical trials, and regulatory drug databases.
                    </p>
                </div>

                {/* Footer Copyright */}
                <div className="relative z-10 text-xs text-zinc-400">
                    &copy; 2026 AI Pharma Platforms. Built for clinical research acceleration.
                </div>
            </div>

            {/* Right Column: Auth Card */}
            <div className="w-full md:w-[480px] p-8 md:p-16 flex flex-col justify-center bg-black">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                    <p className="text-zinc-400 text-sm mb-8">Sign in to resume your research workspace.</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@domain.com"
                                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="w-full p-3 pr-10 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 transition text-xs font-medium"
                                    tabIndex={-1}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-zinc-400">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium underline transition">
                            Create account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
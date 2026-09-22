"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import { registerUser } from "@/services/auth.service";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation checks
        if (!name.trim()) {
            toast.error("Full Name is required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const response = await registerUser(name, email, password);

            if (response.success) {
                toast.success("Registration successful! Please login.");
                router.push("/login");
            } else {
                toast.error(response.message || "Registration failed");
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Registration failed. Please try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
            {/* Left Column: Branding Section */}
            <div className="flex-1 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 p-8 md:p-16 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">AP</span>
                    <span className="text-xl font-bold tracking-tight text-white">AI Pharma</span>
                </div>
                <div className="my-auto py-12 md:py-0 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                        Create Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Research Account</span>
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Join pharmacologists and clinical researchers who use AI Pharma to query literature databases, index clinical trials, and generate reports on drug repurposing.
                    </p>
                </div>
                <div className="text-xs text-zinc-500">
                    &copy; 2026 AI Pharma Platforms. Built for clinical research acceleration.
                </div>
            </div>

            {/* Right Column: Register Card */}
            <div className="w-full md:w-[480px] p-8 md:p-16 flex flex-col justify-center bg-black">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-2">Get started</h2>
                    <p className="text-zinc-400 text-sm mb-6">Create an account to access the workspace.</p>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

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
                                    placeholder="Min. 8 characters"
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
                            <span className="text-[10px] text-zinc-500 block leading-tight">Must contain at least 8 characters.</span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Re-enter password"
                                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium underline transition">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
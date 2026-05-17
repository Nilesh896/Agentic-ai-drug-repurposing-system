"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

import { loginUser } from "@/services/auth.service";

import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
    const router = useRouter();

    const { setAuth } = useAuthStore();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const handleLogin = async () => {
        try {
            const response = await loginUser(
                email,
                password
            );

            const user =
                response.data.user;

            const token =
                response.data.token;

            setAuth(user, token);

            toast.success(
                "Login successful"
            );

            router.push("/dashboard");
        } catch (error) {
            toast.error("Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl border border-zinc-800">
                <h1 className="text-3xl font-bold mb-6 text-center">
                    Login
                </h1>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                    />

                    <button
                        onClick={handleLogin}
                        className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-300 transition"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}
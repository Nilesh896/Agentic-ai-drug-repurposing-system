"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

import { registerUser } from "@/services/auth.service";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const handleRegister =
        async () => {
            try {
                await registerUser(
                    name,
                    email,
                    password
                );

                toast.success(
                    "Registration successful"
                );

                router.push("/login");
            } catch (error) {
                toast.error(
                    "Registration failed"
                );
            }
        };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl border border-zinc-800">
                <h1 className="text-3xl font-bold mb-6 text-center">
                    Register
                </h1>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Name"
                        className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                        value={name}
                        onChange={(e) =>
                            setName(
                                e.target.value
                            )
                        }
                    />

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
                        onClick={
                            handleRegister
                        }
                        className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-300 transition"
                    >
                        Register
                    </button>
                </div>
            </div>
        </div>
    );
}
import { create } from "zustand";

import { persist } from "zustand/middleware";

import { AuthUser } from "@/types/auth.types";

interface AuthState {
    user: AuthUser | null;

    token: string | null;

    hydrated: boolean;

    setHydrated: (
        state: boolean
    ) => void;

    setAuth: (
        user: AuthUser,
        token: string
    ) => void;

    logout: () => void;
}

export const useAuthStore =
    create<AuthState>()(
        persist(
            (set) => ({
                user: null,

                token: null,

                hydrated: false,

                setHydrated: (
                    state
                ) =>
                    set({
                        hydrated: state,
                    }),

                setAuth: (
                    user,
                    token
                ) =>
                    set({
                        user,
                        token,
                    }),

                logout: () =>
                    set({
                        user: null,
                        token: null,
                    }),
            }),
            {
                name: "auth-storage",

                onRehydrateStorage: () => {
                    return (state) => {
                        state?.setHydrated(
                            true
                        );
                    };
                },
            }
        )
    );
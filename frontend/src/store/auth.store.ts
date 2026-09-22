import { create } from "zustand";

import { persist } from "zustand/middleware";

import { AuthUser } from "@/types/auth.types";

interface AuthState {
    user: AuthUser | null;

    token: string | null;

    hydrated: boolean;

    sessionValidated: boolean;

    setHydrated: (
        state: boolean
    ) => void;

    setSessionValidated: (
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

                sessionValidated: false,

                setHydrated: (
                    state
                ) =>
                    set({
                        hydrated: state,
                    }),

                setSessionValidated: (
                    state
                ) =>
                    set({
                        sessionValidated: state,
                    }),

                setAuth: (
                    user,
                    token
                ) =>
                    set({
                        user,
                        token,
                        sessionValidated: true,
                    }),

                logout: () =>
                    set({
                        user: null,
                        token: null,
                        sessionValidated: false,
                    }),
            }),
            {
                name: "auth-storage",

                partialize: (state) => ({
                    user: state.user,
                    token: state.token,
                }),

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
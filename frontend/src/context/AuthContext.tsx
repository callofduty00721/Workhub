import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, type OtpRequiredResponse } from "@/api/auth";
import { rolesApi } from "@/api/roles";
import { setAccessToken } from "@/api/axios";
import type { User, UserRole } from "@/types";

interface RegisterIdentifier {
  email?: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (identifier: RegisterIdentifier, password: string) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  register: (
    name: string,
    identifier: RegisterIdentifier,
    password: string,
    role?: UserRole,
    referralCode?: string
  ) => Promise<User | OtpRequiredResponse>;
  verifyOtp: (ticket: string, otp: string) => Promise<User>;
  // Returns the new ticket to keep using — email resends rotate the ticket
  // (it carries the OTP hash), phone resends echo the same one back.
  resendOtp: (ticket: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authApi.refresh();
        setAccessToken(res.accessToken);
        if (!cancelled) setUser(res.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: RegisterIdentifier, password: string) => {
    const res = await authApi.login({ ...identifier, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const res = await authApi.googleLogin(idToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  // Both channels now come back as `requiresOtpVerification` — no session
  // yet, the caller (Register.tsx) shows an OTP screen and finishes via
  // verifyOtp below.
  const register = useCallback(
    async (name: string, identifier: RegisterIdentifier, password: string, role?: UserRole, referralCode?: string) => {
      const res = await authApi.register({ name, ...identifier, password, role, referralCode });
      if ("requiresOtpVerification" in res) return res;
      setAccessToken(res.accessToken);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const verifyOtp = useCallback(async (ticket: string, otp: string) => {
    const res = await authApi.verifyOtp({ ticket, otp });
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const resendOtp = useCallback(async (ticket: string) => {
    const res = await authApi.resendOtp(ticket);
    return res.ticket;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authApi.me();
    setUser(res.user);
  }, []);

  // The backend only returns a small role/verification slice here (not a full
  // User), so merge it onto the existing user in state rather than replacing.
  const switchRole = useCallback(async (role: UserRole) => {
    const res = await rolesApi.switchRole(role);
    setUser((prev) => (prev ? { ...prev, ...res.user } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, loginWithGoogle, register, verifyOtp, resendOtp, logout, refreshUser, switchRole }),
    [user, isLoading, login, loginWithGoogle, register, verifyOtp, resendOtp, logout, refreshUser, switchRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

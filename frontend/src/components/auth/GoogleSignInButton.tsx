import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;

    const scriptId = "google-identity-services";
    const initialize = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          const user = await loginWithGoogle(response.credential);
          navigate(dashboardPathForRole(user.role), { replace: true });
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, { theme: "outline", size: "large", width: 360 });
    };

    if (window.google) {
      initialize();
      return;
    }

    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initialize;
    document.body.appendChild(script);
  }, [loginWithGoogle, navigate]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="flex w-full justify-center" />;
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { postLoginPath } from "@/lib/roles";

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

    // Google's button is a fixed-width iframe (in px, not %), so it doesn't
    // shrink with its container on its own. Re-render it at the container's
    // actual width whenever that width changes (initial layout, resize,
    // orientation change) instead of hardcoding one width that overflows
    // narrow screens like the auth card on mobile.
    const renderAtContainerWidth = () => {
      const container = containerRef.current;
      if (!window.google || !container) return;
      container.innerHTML = "";
      const width = Math.min(Math.max(Math.round(container.offsetWidth), 200), 400);
      window.google.accounts.id.renderButton(container, { theme: "outline", size: "large", width });
    };

    const initialize = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          const user = await loginWithGoogle(response.credential);
          navigate(postLoginPath(user.role), { replace: true });
        },
      });
      renderAtContainerWidth();
    };

    let resizeObserver: ResizeObserver | undefined;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => renderAtContainerWidth());
      resizeObserver.observe(containerRef.current);
    }

    if (window.google) {
      initialize();
    } else if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = initialize;
      document.body.appendChild(script);
    }

    return () => resizeObserver?.disconnect();
  }, [loginWithGoogle, navigate]);

  // No VITE_GOOGLE_CLIENT_ID set yet — show a placeholder that looks like the
  // real button so the UI reads correctly before the OAuth client exists, but
  // it can't actually sign anyone in (there's no client id to authenticate
  // against). Swapped for the real Google-rendered button automatically once
  // the env var is set — no other code change needed.
  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in isn't configured yet — set VITE_GOOGLE_CLIENT_ID"
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-60"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
          />
          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09Z" />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.6 4.6 1.79l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
          />
        </svg>
        Continue with Google
      </button>
    );
  }

  return <div ref={containerRef} className="flex w-full justify-center" />;
}

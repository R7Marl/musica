"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { AuthSession } from "@/lib/types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; width?: number },
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  onLogin: (session: AuthSession) => void;
}

export function GoogleSignIn({ onLogin }: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const initializeGoogle = useCallback(() => {
    if (!clientId || !window.google || !buttonRef.current) {
      return;
    }

    try {
      buttonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          void api
            .loginWithGoogle(response.credential)
            .then((session) => {
              saveSession(session);
              onLogin(session);
            })
            .catch((err: unknown) => {
              setError(
                err instanceof Error
                  ? err.message
                  : "No se pudo ingresar con Google.",
              );
            });
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 280,
      });
      setError("");

      window.setTimeout(() => {
        if (!buttonRef.current?.children.length) {
          setError(
            `Google no habilito el origen ${window.location.origin}. Verifica los origenes autorizados.`,
          );
        }
      }, 1500);
    } catch {
      setError(
        `Google rechazo el origen ${window.location.origin}. Verifica la configuracion OAuth.`,
      );
    }
  }, [clientId, onLogin]);

  useEffect(() => {
    if (window.google) {
      initializeGoogle();
      return;
    }

    const script = document.getElementById("google-identity-services");
    const handleLoad = () => initializeGoogle();
    script?.addEventListener("load", handleLoad);

    const timeout = window.setTimeout(() => {
      if (!window.google) {
        setError("No se pudo cargar Google Sign-In.");
      }
    }, 5000);

    return () => {
      script?.removeEventListener("load", handleLoad);
      window.clearTimeout(timeout);
    };
  }, [initializeGoogle]);

  if (!clientId) {
    return (
      <p className="form-error">
        Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.
      </p>
    );
  }

  return (
    <div className="google-sign-in">
      <div ref={buttonRef} />
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

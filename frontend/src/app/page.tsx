"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  LineChart,
  LockKeyhole,
  Megaphone,
  MonitorPlay,
  Music2,
  QrCode,
  Sparkles,
} from "lucide-react";
import { LoginPanel } from "@/components/LoginPanel";
import { PublicQueue } from "@/components/PublicQueue";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { getBusinessSlugFromHost } from "@/lib/tenant";
import { AuthSession, PublicBusinessResponse } from "@/lib/types";

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qfit.app";
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "QFit",
      url: siteUrl,
      description:
        "Plataforma para implementar musica dinamica y playlists colaborativas con QR en locales, gimnasios, bares y salas.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "QFit",
      inLanguage: "es-AR",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "QFit",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Software web para que los clientes pidan canciones con QR y el negocio controle la musica desde un panel.",
    },
  ],
};

export default function Home() {
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [business, setBusiness] = useState<PublicBusinessResponse | null>(null);
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    setBusinessSlug(getBusinessSlugFromHost(window.location.host));
  }, []);

  useEffect(() => {
    if (!businessSlug) {
      setBusiness(null);
      return;
    }

    api
      .getPublicBusiness(businessSlug)
      .then((data) => setBusiness(data))
      .catch((err) => {
        setBusiness(null);
        console.error(err);
      });
  }, [businessSlug]);

  function handleLogin(session: AuthSession) {
    window.location.href = session.user.role === "owner" ? "/owner" : "/dashboard";
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const userEmail = String(form.get("userEmail") || "").trim();
    const userPassword = String(form.get("userPassword") || "");

    setRegisterError("");
    setIsRegistering(true);

    try {
      await api.registerBusiness({
        name: String(form.get("name") || "").trim(),
        userEmail,
        userPassword,
        defaultQueueName: String(form.get("defaultQueueName") || "Principal").trim(),
      });
      const session = await api.login(userEmail, userPassword);
      saveSession(session);

      const gtag = (window as GtagWindow).gtag;
      gtag?.("event", "generate_lead", {
        event_category: "business_registration",
        event_label: "free_signup",
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : "No pudimos crear tu cuenta",
      );
    } finally {
      setIsRegistering(false);
    }
  }

  if (business) {
    const primaryQueue = business.queues[0];

    return (
      <main className="tenant-layout">
        <section className="tenant-hero">
          <p className="eyebrow">QFit</p>
          <h1>{business.business.name}</h1>
          <p>
            Elegi una playlist y suma la musica que queres escuchar mientras entrenas.
          </p>
        </section>

        {primaryQueue ? (
          <PublicQueue queueName={primaryQueue.name} queueSlug={primaryQueue.slug} />
        ) : (
          <section className="panel">
            <h2>No hay playlists activas</h2>
            <p className="muted">
              El equipo todavia no habilito una playlist para recibir canciones.
            </p>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="landing-hero" aria-labelledby="landing-title">
        <nav className="landing-nav" aria-label="Principal">
          <a className="landing-brand" href="#inicio" aria-label="QFit inicio">
            <Music2 size={22} />
            QFit
          </a>
          <div className="landing-nav-actions">
            <a href="#como-funciona">Como funciona</a>
            <a href="#login">Ingresar</a>
          </div>
        </nav>

        <div className="landing-hero-content" id="inicio">
          <p className="eyebrow">Musica dinamica para locales</p>
          <h1 id="landing-title">Tus clientes eligen la musica. Vos controlas el ambiente.</h1>
          <p>
            QFit convierte cualquier local, gimnasio, bar o salon en una playlist
            colaborativa con QR. La gente pide canciones desde su celular y tu equipo
            decide que suena en pantalla, sin instalaciones raras ni equipos especiales.
          </p>
          <a className="button primary landing-main-cta" href="#registro">
            Registrarme gratis
            <ArrowRight size={20} />
          </a>
        </div>

        <div className="landing-proof" aria-label="Beneficios principales">
          <span>
            <BadgeCheck size={16} />
            Gratis para empezar
          </span>
          <span>
            <QrCode size={16} />
            QR para cada playlist
          </span>
          <span>
            <Megaphone size={16} />
            Listo para Google Ads
          </span>
        </div>
      </section>

      <section className="landing-section landing-intro" id="como-funciona">
        <div>
          <p className="eyebrow">En simples palabras</p>
          <h2>Una fila musical para tu local</h2>
        </div>
        <p>
          Creas una playlist, mostras un QR y tus clientes agregan canciones. El player
          del local reproduce el contenido en orden, con moderacion desde tu panel para
          mantener la energia correcta durante todo el dia.
        </p>
      </section>

      <section className="landing-feature-grid" aria-label="Funciones de QFit">
        <article>
          <QrCode size={22} />
          <h3>Registro y QR inmediato</h3>
          <p>Tu negocio queda listo con una playlist principal para imprimir o mostrar.</p>
        </article>
        <article>
          <MonitorPlay size={22} />
          <h3>Player para pantalla</h3>
          <p>Abris el reproductor en la PC del local y todos ven que esta sonando.</p>
        </article>
        <article>
          <LineChart size={22} />
          <h3>Mas participacion</h3>
          <p>La musica deja de ser de fondo y se vuelve una accion simple del cliente.</p>
        </article>
      </section>

      <section className="landing-use-cases" aria-label="Locales que pueden usar QFit">
        <div>
          <p className="eyebrow">Para que tipo de negocio sirve</p>
          <h2>Musica interactiva para locales con clientes presentes</h2>
          <p>
            QFit esta pensado para espacios donde la musica ayuda a vender, retener y
            mejorar la experiencia: gimnasios, boxes de entrenamiento, bares,
            cafeterias, salones de eventos, barberias, tiendas y salas de espera.
          </p>
        </div>
        <div className="landing-use-case-list">
          <article>
            <h3>Gimnasios y estudios</h3>
            <p>
              Tus socios piden canciones para entrenar y el staff mantiene una playlist
              activa, visible y ordenada.
            </p>
          </article>
          <article>
            <h3>Bares, cafeterias y locales</h3>
            <p>
              Converti la musica ambiental en una accion simple para clientes sin perder
              el control del contenido.
            </p>
          </article>
          <article>
            <h3>Eventos y salas privadas</h3>
            <p>
              Compartis un QR, recibis pedidos y reproducis la fila musical desde una
              pantalla o computadora principal.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-register-band" id="registro">
        <div className="landing-register-copy">
          <p className="eyebrow">Alta gratuita</p>
          <h2>Registra tu negocio y prueba QFit hoy</h2>
          <p>
            Sin tarjeta y sin instalacion complicada. Creas la cuenta, entras al panel,
            copias el QR y ya podes probar musica dinamica en tu local.
          </p>
          <div className="landing-mini-proof">
            <span>
              <Sparkles size={16} />
              Ideal para gimnasios, bares y salas
            </span>
            <span>
              <Headphones size={16} />
              Control del contenido desde el panel
            </span>
          </div>
        </div>

        <form className="panel landing-register-form" onSubmit={handleRegister}>
          <div>
            <p className="eyebrow">Crear cuenta</p>
            <h2>Empezar gratis</h2>
          </div>
          <label>
            Nombre del negocio
            <input
              autoComplete="organization"
              name="name"
              placeholder="Ej. Power Gym Palermo"
              required
            />
          </label>
          <label>
            Email de acceso
            <input
              autoComplete="email"
              name="userEmail"
              placeholder="admin@tulocal.com"
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              minLength={8}
              name="userPassword"
              placeholder="Minimo 8 caracteres"
              type="password"
              required
            />
          </label>
          <label>
            Nombre de la primera playlist
            <input
              name="defaultQueueName"
              placeholder="Principal"
              defaultValue="Principal"
            />
          </label>

          {registerError ? <p className="form-error">{registerError}</p> : null}

          <button className="button primary" disabled={isRegistering} type="submit">
            <ArrowRight size={18} />
            {isRegistering ? "Creando cuenta" : "Registrarme gratis"}
          </button>
          <p className="landing-form-note">
            Al registrarte se crea tu negocio, tu usuario administrador y una playlist
            inicial para compartir.
          </p>
        </form>
      </section>

      <section className="landing-ads-band">
        <div>
          <p className="eyebrow">Para publicidad en Google</p>
          <h2>Pagina preparada para convertir visitas en registros</h2>
        </div>
        <p>
          La landing usa mensajes directos, CTA visible, contenido enfocado en busquedas
          como musica dinamica para locales y un evento de conversion cuando alguien se
          registra.
        </p>
      </section>

      <section className="landing-faq" aria-labelledby="faq-title">
        <div>
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 id="faq-title">Antes de implementar musica dinamica en tu local</h2>
        </div>
        <div className="landing-faq-list">
          <article>
            <h3>Que es musica dinamica para locales?</h3>
            <p>
              Es una forma de que la musica del negocio cambie con la participacion de
              los clientes. En QFit, cada persona escanea un QR y propone canciones para
              una playlist que el local controla.
            </p>
          </article>
          <article>
            <h3>Necesito instalar algo?</h3>
            <p>
              No. QFit funciona desde el navegador. El negocio usa un panel para
              administrar playlists y un player para reproducir la musica en la pantalla
              o computadora del local.
            </p>
          </article>
          <article>
            <h3>El registro es gratuito?</h3>
            <p>
              Si. Podes registrar tu negocio gratis, crear una playlist inicial y probar
              el QR con tus clientes.
            </p>
          </article>
          <article>
            <h3>Puedo controlar lo que suena?</h3>
            <p>
              Si. Tus clientes participan, pero el negocio mantiene el control desde el
              panel para ordenar la fila musical y cuidar el ambiente.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-login-grid" id="login">
        <div className="landing-login-copy">
          <LockKeyhole size={24} />
          <p className="eyebrow">Ya tengo cuenta</p>
          <h2>Ingresa al panel de tu negocio</h2>
          <p>
            Si ya registraste tu local, entra para administrar playlists, copiar QR y
            abrir el player de pantalla.
          </p>
        </div>
        <LoginPanel
          title="Entrar a QFit"
          subtitle="Usa el email y password de tu negocio para administrar tus playlists."
          eyebrow="Panel privado"
          buttonLabel="Ingresar"
          onLogin={handleLogin}
        />
      </section>
    </main>
  );
}

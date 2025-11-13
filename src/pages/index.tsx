import type { JSX } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { Button, LogoMark } from "@/components";
import { useAuth } from "@/hooks";

const features = [
  {
    title: "Gestiona clientes con valor y fechas",
    body: "Registra personas y empresas, distingue su tipo y lleva el seguimiento del valor del contrato, fecha de inicio y fin. Edita en línea para actualizar datos al instante.",
  },
  {
    title: "Tableros Kanban para tareas y proyectos",
    body: "Flujo de tres columnas (Por hacer, En progreso, Completado) con arrastrar y soltar, y navegación por teclado. Gestiona visualmente tanto tareas como proyectos.",
  },
  {
    title: "Archivos organizados por categorías",
    body: "Imágenes, documentos, videos, audio, archivos comprimidos y otros. Sube por arrastrar y soltar, asocia a proyectos y filtra por proyecto o tipo de archivo.",
  },
  {
    title: "Gestión completa de proyectos y tareas",
    body: "Estatus (todo, in_progress, done), prioridades (low, medium, high), fechas límite y relación proyecto‑tarea. Cambia entre tabla y tablero según lo necesites.",
  },
];

export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate("/dashboard", { replace: true });
    }
  }, [auth.status, navigate]);

  if (auth.status === "loading") {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="text-foreground relative flex min-h-screen flex-col items-center bg-[radial-gradient(110%_140%_at_30%_0%,#fff8d6,rgba(255,243,205,0.9)_45%,#fff9ee_100%)] px-6 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_85%_at_80%_35%,rgba(253,239,182,0.65),transparent_70%)] opacity-70" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 pt-24">
        <section className="grid items-center gap-16 text-left md:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-medium tracking-[0.2em] text-neutral-600 uppercase shadow-sm">
              <span>Clientes, proyectos y archivos en un flujo visual</span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-[760px] text-5xl leading-[1.08] font-semibold tracking-tight text-neutral-900 md:text-6xl">
                Gestiona clientes, proyectos y archivos en un solo lugar
              </h1>
              <p className="max-w-xl text-lg text-neutral-600">
                Seguimiento de clientes (personas y empresas) con valores de contrato y fechas,
                tableros Kanban para tareas y proyectos, y archivos categorizados por tipo
                vinculados a proyectos.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full rounded-lg px-5 py-3 text-base font-medium shadow-sm aria-busy:cursor-wait sm:w-auto"
                  aria-label="Crear un espacio de trabajo en Entipedia"
                  role="button"
                >
                  Comenzar prueba gratuita
                </Button>
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-foreground w-full rounded-lg border border-neutral-200 bg-white px-5 py-3 text-base font-medium shadow-sm hover:bg-neutral-50 sm:w-auto"
                  aria-label="Iniciar sesión en Entipedia"
                  role="button"
                >
                  Iniciar sesión
                </Button>
              </Link>
            </div>
            <dl className="grid gap-4 text-sm text-neutral-600 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-neutral-900">Tableros Kanban listos para usar</dt>
                <dd className="mt-1 text-xs tracking-[0.18em] text-neutral-500 uppercase">
                  Por hacer · En progreso · Completado
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">Módulos esenciales integrados</dt>
                <dd className="mt-1 text-xs tracking-[0.18em] text-neutral-500 uppercase">
                  Clientes, Proyectos, Tareas y Archivos
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">
                  Diseñado para equipos en crecimiento
                </dt>
                <dd className="mt-1 text-xs tracking-[0.18em] text-neutral-500 uppercase">
                  Edición en línea y filtros por estado, prioridad y tipo
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="from-primary/40 absolute -inset-y-14 -right-10 -left-16 rounded-[48px] bg-linear-to-br via-white to-white opacity-70 blur-2xl" />
            <div className="shadow-primary/20 relative w-full max-w-md rounded-3xl border border-black/10 bg-white/90 p-10 shadow-xl">
              <div className="flex items-center gap-3">
                <LogoMark size="sm" />
                <div>
                  <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                    Vista previa
                  </p>
                  <p className="text-lg font-semibold text-neutral-900">Resumen de hoy</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-xl border border-neutral-200/60 bg-amber-50/80 px-4 py-3 text-neutral-800 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.28em] text-neutral-500 uppercase">
                    Cliente activo
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    ACME S.A. · Empresa · Valor $25,000
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Periodo: 01/01/2025 — 30/06/2025 · Edición en línea
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-neutral-800 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.28em] text-neutral-500 uppercase">
                    Proyecto en progreso
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    Sitio web corporativo · En Progreso
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    2 tareas en progreso · 5 por hacer · Tablero Kanban
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-neutral-800 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.28em] text-neutral-500 uppercase">
                    Archivos categorizados
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    3 archivos subidos · Imágenes y documentos
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Asociados al proyecto Marketing · hace 4 min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid w-full gap-8 text-left md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-black/5 bg-white/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="from-primary/10 absolute inset-0 -z-10 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <h2 className="text-lg font-medium text-neutral-900">{feature.title}</h2>
              <p className="mt-2 text-sm text-neutral-600">{feature.body}</p>
            </div>
          ))}
        </section>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600">
          <Link to="/about" className="transition-colors hover:text-neutral-900">
            Acerca de
          </Link>
          <a
            href="https://github.com/Georgeb779/entipedia"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-neutral-900"
          >
            GitHub
          </a>
        </nav>
      </div>
    </div>
  );
}

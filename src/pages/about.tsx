import type { JSX } from "react";
import { Link } from "react-router";

import { Button, LogoMark } from "@/components";

const pillars = [
  {
    title: "Unifica flujos de tareas",
    body: "Sigue asignaciones desde listas rápidas hasta flujos Kanban detallados, con prioridades, fechas de vencimiento y contexto del proyecto.",
  },
  {
    title: "Destaca la información de tus proyectos",
    body: "Monitorea el progreso con tableros desde el momento en que inicias sesión, para que cuellos de botella y logros permanezcan visibles.",
  },
  {
    title: "Impulsa la colaboración del equipo",
    body: "Mantén a todos alineados con tableros compartidos, filtros rápidos y una navegación familiar en cualquier lugar.",
  },
  {
    title: "Asegura un almacenamiento inteligente",
    body: "Organiza archivos críticos junto a cada proyecto para que el contexto siempre esté al alcance.",
  },
];

export default function About(): JSX.Element {
  return (
    <div className="text-foreground flex min-h-screen flex-col bg-[radial-gradient(110%_130%_at_50%_-10%,rgba(246,201,14,0.18),#fffdf8_60%,#fffdf8)] px-6 pb-20">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 pt-24 text-center">
        <header className="animate-fade-in space-y-6">
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              Acerca de Entipedia
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base">
              Construimos Entipedia para unificar planificación, documentación y ejecución, de modo
              que los equipos modernos colaboren con claridad y ritmo.
            </p>
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm">
            Desde tableros Kanban hasta centros de documentos, cada superficie se mantiene en
            sincronía para ayudarte a entregar más rápido sin sacrificar enfoque ni contexto.
          </p>
        </header>

        <section className="grid w-full gap-6 text-left sm:grid-cols-2">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative overflow-hidden rounded-xl border border-black/5 bg-white/85 p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="from-primary/10 absolute inset-0 -z-10 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <h2 className="text-foreground text-lg font-medium">{pillar.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            ¿Listo para comenzar?
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full px-5 py-2.5 text-base sm:w-auto"
                aria-label="Crear una cuenta en Entipedia"
                role="button"
              >
                Crear una cuenta
              </Button>
            </Link>
            <Link to="/auth/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="text-foreground w-full border border-black/10 bg-white px-5 py-2.5 text-base shadow-sm hover:bg-neutral-50 sm:w-auto"
                aria-label="Iniciar sesión en Entipedia"
                role="button"
              >
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="lg"
                className="text-foreground w-full px-5 py-2.5 text-base hover:bg-white/70 sm:w-auto"
                aria-label="Volver a la página principal de Entipedia"
                role="button"
              >
                Volver al inicio
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

import type { JSX } from "react";
import { Link } from "react-router";

import { Button, LogoMark } from "@/components";

const pillars = [
  {
    title: "Gestiona clientes con precisión",
    body: "Distingue entre personas y empresas, registra el valor del contrato y gestiona fechas de inicio y cierre. Actualiza en línea con edición por celda y navegación por teclado para cambios rápidos.",
  },
  {
    title: "Visualiza el trabajo con tableros Kanban",
    body: "Flujo de tres columnas (Por Hacer, En Progreso, Completado) con arrastrar y soltar para tareas y proyectos. Alterna entre vista tabla y tablero, con soporte de accesibilidad mediante teclado.",
  },
  {
    title: "Organiza archivos con categorías inteligentes",
    body: "Clasificación automática en seis categorías (imágenes, documentos, videos, audio, archivos y otros). Sube por arrastrar y soltar, asocia cada archivo a su proyecto y filtra por tipo o proyecto.",
  },
  {
    title: "Controla tareas y proyectos con flexibilidad",
    body: "Seguimiento de estado (por hacer, en progreso, completado), prioridades (baja, media, alta) y fechas de vencimiento. Relaciona tareas a proyectos, filtra por estado/prioridad/proyecto y usa vistas tabla o tablero.",
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
              Entipedia centraliza cuatro capacidades clave: gestión de clientes, flujos de trabajo
              visuales, organización de archivos y seguimiento flexible de tareas y proyectos. Ideal
              para equipos que necesitan alinear relaciones con clientes y trabajo operativo.
            </p>
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm">
            Incluye edición en línea compatible con teclado, arrastrar y soltar en tableros, filtros
            por estado y prioridad, y vistas duales (tabla/kanban) para adaptarse a cada necesidad.
            Los archivos se categorizan automáticamente y permanecen vinculados al contexto del
            proyecto.
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

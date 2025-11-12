import { useMemo } from "react";
import { Link } from "react-router";
import { Home, Mail } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  DEFAULT_TEAM_MEMBER,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_STYLES,
  resolveActiveMember,
  type TeamMember,
} from "@/data/users";
import { useAuth } from "@/hooks";
import { cn } from "@/utils";

type UserProfileMode = "summary" | "detail";

type UserProfileContentProps = {
  mode?: UserProfileMode;
};

const joinedFormatter = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const formatJoinedDate = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Fecha no disponible";
  }

  return joinedFormatter.format(parsed);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  const [first, second] = parts;
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

const resolveStats = (member: TeamMember, mode: UserProfileMode) =>
  mode === "detail"
    ? [
        { label: "Proyectos activos", value: member.projects.toString() },
        { label: "Tareas en curso", value: member.tasksInProgress.toString() },
        { label: "Equipo", value: member.team },
      ]
    : [
        { label: "Proyectos activos", value: member.projects.toString() },
        { label: "Tareas en curso", value: member.tasksInProgress.toString() },
        { label: "Última actividad", value: member.lastActive },
      ];

export default function UserProfileContent({ mode = "detail" }: UserProfileContentProps) {
  const auth = useAuth();
  const member = useMemo(() => resolveActiveMember(auth), [auth]);

  const displayName = member.name || DEFAULT_TEAM_MEMBER.name;
  const displayEmail = member.email || DEFAULT_TEAM_MEMBER.email;
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const stats = useMemo(() => resolveStats(member, mode), [member, mode]);

  const infoRows =
    mode === "detail"
      ? [
          { label: "Miembro desde", value: formatJoinedDate(member.joinedAt) },
          { label: "Última actividad", value: member.lastActive },
        ]
      : [
          { label: "Miembro desde", value: member.joinedAt },
          { label: "Ubicación", value: member.location },
        ];

  const headerTitle = mode === "detail" ? "Mi perfil" : "Miembro activo";
  const headerDescription =
    mode === "detail"
      ? "Información personal y actividad reciente asociada a tu cuenta de Entipedia."
      : "Esta sección refleja únicamente la información del usuario autenticado en Entipedia.";

  const containerWidth = mode === "detail" ? "max-w-4xl" : "max-w-3xl";

  return (
    <div className="text-foreground px-5 sm:px-6 sm:py-10 md:py-0">
      <div className={cn("mx-auto flex w-full flex-col gap-6", containerWidth)}>
        {mode === "detail" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/dashboard" aria-label="Ir al panel">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Ir al panel</span>
              </Link>
            </Button>
          </div>
        ) : null}

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{headerTitle}</h1>
          <p className="text-muted-foreground text-sm">{headerDescription}</p>
        </header>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold">{displayName}</CardTitle>
                <CardDescription className="text-sm">
                  {member.role} · {member.team}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <a
                    href={`mailto:${displayEmail}`}
                    className="text-neutral-900 underline decoration-transparent transition-colors hover:decoration-neutral-400"
                  >
                    {displayEmail}
                  </a>
                </div>
              </div>
            </div>
            <Badge className={cn("uppercase", MEMBER_STATUS_STYLES[member.status])}>
              {MEMBER_STATUS_LABELS[member.status]}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-900">Resumen</h2>
              <p className="text-sm leading-relaxed text-neutral-700">{member.bio}</p>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[rgba(0,0,0,0.05)] bg-white/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-neutral-900">{stat.value}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
              {infoRows.map((info) => (
                <div
                  key={info.label}
                  className="flex items-center justify-between rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] bg-white/70 px-4 py-3"
                >
                  <span>{info.label}</span>
                  <span className="font-medium text-neutral-900">{info.value}</span>
                </div>
              ))}
            </section>

            {mode === "summary" ? (
              <section className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  Enfoque actual
                </p>
                <div className="flex flex-wrap gap-2">
                  {member.focusAreas.map((focus) => (
                    <span
                      key={focus}
                      className="rounded-full bg-[rgba(28,36,49,0.06)] px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-wrap gap-3">
            {mode === "summary" ? (
              <>
                <Button asChild variant="secondary">
                  <Link to="/users">Ver detalles</Link>
                </Button>
                <Button asChild variant="ghost">
                  <a href={`mailto:${displayEmail}`}>Contactar</a>
                </Button>
              </>
            ) : (
              <Button asChild variant="secondary">
                <a href={`mailto:${displayEmail}`}>Contactar</a>
              </Button>
            )}
          </CardFooter>
        </Card>

        {mode === "detail" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Áreas de enfoque</CardTitle>
              <CardDescription>
                Principales temas en los que estás colaborando actualmente con el equipo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {member.focusAreas.map((focus) => (
                <Badge
                  key={focus}
                  variant="secondary"
                  className="bg-[rgba(28,36,49,0.08)] text-neutral-800"
                >
                  {focus}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

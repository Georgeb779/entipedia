import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowLeft, Home, Mail } from "lucide-react";

import { Layout, ProtectedRoute } from "@/components";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
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

export default function UserProfile() {
  const auth = useAuth();

  const profileMember = useMemo<TeamMember>(() => resolveActiveMember(auth), [auth]);

  const displayName = profileMember.name || DEFAULT_TEAM_MEMBER.name;
  const displayEmail = profileMember.email || DEFAULT_TEAM_MEMBER.email;

  const stats = [
    { label: "Proyectos activos", value: profileMember.projects.toString() },
    { label: "Tareas en curso", value: profileMember.tasksInProgress.toString() },
    { label: "Equipo", value: profileMember.team },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-5 py-10 md:px-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link to="/users" aria-label="Volver al equipo">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Volver al equipo</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link to="/dashboard" aria-label="Ir al panel">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  <span>Ir al panel</span>
                </Link>
              </Button>
            </div>

            <header className="space-y-2">
              <h1 className="text-3xl font-semibold">Mi perfil</h1>
              <p className="text-muted-foreground text-sm">
                Información personal y actividad reciente asociada a tu cuenta de Entipedia.
              </p>
            </header>

            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-semibold">{displayName}</CardTitle>
                    <CardDescription className="text-sm">
                      {profileMember.role} · {profileMember.team}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
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
                <Badge className={cn("uppercase", MEMBER_STATUS_STYLES[profileMember.status])}>
                  {MEMBER_STATUS_LABELS[profileMember.status]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-neutral-900">Resumen</h2>
                  <p className="text-sm leading-relaxed text-neutral-700">{profileMember.bio}</p>
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
                  <div className="flex items-center justify-between rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] bg-white/70 px-4 py-3">
                    <span>Miembro desde</span>
                    <span className="font-medium text-neutral-900">
                      {formatJoinedDate(profileMember.joinedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] bg-white/70 px-4 py-3">
                    <span>Última actividad</span>
                    <span className="font-medium text-neutral-900">{profileMember.lastActive}</span>
                  </div>
                </section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Áreas de enfoque</CardTitle>
                <CardDescription>
                  Principales temas en los que estás colaborando actualmente con el equipo.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {profileMember.focusAreas.map((focus) => (
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
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

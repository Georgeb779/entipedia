import type { AuthState } from "@/types";

export type MemberStatus = "active" | "invited" | "away";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: MemberStatus;
  projects: number;
  tasksInProgress: number;
  lastActive: string;
  joinedAt: string;
  location: string;
  bio: string;
  focusAreas: string[];
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Activo",
  invited: "Invitación pendiente",
  away: "Fuera de oficina",
};

export const MEMBER_STATUS_STYLES: Record<MemberStatus, string> = {
  active: "bg-[#E8B90D]/15 text-[#7a5700]",
  invited: "bg-neutral-200 text-neutral-800",
  away: "bg-[#ffe4d6] text-[#9b3f00]",
};

export const DEFAULT_TEAM_MEMBER: TeamMember = {
  id: "default-member",
  name: "Equipo Entipedia",
  email: "equipo@entipedia.com",
  role: "Colaborador principal",
  team: "General",
  status: "active",
  projects: 3,
  tasksInProgress: 2,
  lastActive: "Sincronizado recientemente",
  joinedAt: "2023-01-15",
  location: "Remoto",
  bio: "Representa a los integrantes activos de Entipedia cuando la información personalizada aún no está disponible.",
  focusAreas: [
    "Colaboración interfuncional",
    "Planificación de lanzamientos",
    "Mejora continua del producto",
  ],
};

export const resolveActiveMember = (auth: AuthState): TeamMember => {
  if (auth.status !== "authenticated") {
    return DEFAULT_TEAM_MEMBER;
  }

  const { user } = auth;

  return {
    ...DEFAULT_TEAM_MEMBER,
    id: typeof user.id === "string" && user.id.length > 0 ? user.id : DEFAULT_TEAM_MEMBER.id,
    name: user.name ?? DEFAULT_TEAM_MEMBER.name,
    email: user.email ?? DEFAULT_TEAM_MEMBER.email,
    joinedAt:
      user.createdAt instanceof Date ? user.createdAt.toISOString() : DEFAULT_TEAM_MEMBER.joinedAt,
    lastActive:
      user.updatedAt instanceof Date
        ? user.updatedAt.toISOString()
        : DEFAULT_TEAM_MEMBER.lastActive,
    status: "active",
    projects: 0,
    tasksInProgress: 0,
  };
};

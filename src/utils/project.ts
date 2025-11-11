/**
 * Utilities for transforming project data and calculating project statistics.
 */
import type { ApiProject, ApiProjectWithTaskCount, Project, ProjectWithTaskCount } from "@/types";

const parseDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/**
 * Maps an API project payload (with ISO string dates) into the frontend {@link Project} type.
 */
export const mapApiProject = (project: ApiProject): Project => ({
  ...project,
  createdAt: parseDate(project.createdAt),
  updatedAt: parseDate(project.updatedAt),
});

/**
 * Maps an API project payload with aggregated task counts into {@link ProjectWithTaskCount}.
 */
export const mapApiProjectWithTaskCount = (
  project: ApiProjectWithTaskCount,
): ProjectWithTaskCount => ({
  ...project,
  createdAt: parseDate(project.createdAt),
  updatedAt: parseDate(project.updatedAt),
});

/**
 * Calculates a project's completion percentage based on completed and total task counts.
 */
export const calculateProjectProgress = (
  completedTaskCount: number,
  totalTaskCount: number,
): number => {
  if (totalTaskCount === 0) {
    return 0;
  }

  return Math.round((completedTaskCount / totalTaskCount) * 100);
};

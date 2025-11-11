import { useCallback } from "react";
import { Link } from "react-router";

import { KanbanBoard, Layout, ProtectedRoute } from "@/components";
import { Button } from "@/components/ui";
import { useTasks, useUpdateTaskStatus } from "@/hooks";
import type { TaskStatus } from "@/types";

/**
 * Presents a Kanban board view of tasks with drag-and-drop status updates.
 */
const KanbanPage = () => {
  const { data: tasks = [], isLoading, error } = useTasks();
  const updateTaskStatus = useUpdateTaskStatus();

  const handleTaskStatusChange = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      try {
        await updateTaskStatus.mutateAsync({ taskId, status: newStatus });
      } catch {
        // Mutation hook performs optimistic rollback on failure.
      }
    },
    [updateTaskStatus],
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-6 py-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-semibold">Kanban Board</h1>
                <p className="text-sm text-gray-400">
                  Drag and drop tasks between columns to update their status.
                </p>
              </div>
              <div className="flex gap-2">
                <Link to="/tasks">
                  <Button variant="outline">View List</Button>
                </Link>
              </div>
            </header>

            <section className="rounded-lg bg-gray-800 p-6">
              {isLoading ? (
                <div className="py-12 text-center text-gray-400">Loading tasks...</div>
              ) : error ? (
                <div className="py-12 text-center text-red-400">
                  {error instanceof Error ? error.message : "Failed to load tasks."}
                </div>
              ) : (
                <KanbanBoard
                  tasks={tasks}
                  onTaskStatusChange={handleTaskStatusChange}
                  isUpdating={updateTaskStatus.isPending}
                />
              )}
            </section>

            <footer className="text-center text-sm text-gray-400">
              <p>Use mouse or keyboard (Tab + Arrow keys + Space/Enter) to move tasks.</p>
            </footer>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default KanbanPage;

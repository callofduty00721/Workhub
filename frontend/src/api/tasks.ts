import { api } from "./axios";
import type { Task, TaskType } from "@/types";

export interface TaskFilters {
  from?: string;
  to?: string;
}

export const taskApi = {
  mine: (filters: TaskFilters = {}) => api.get<{ success: boolean; data: Task[] }>("/tasks/mine", { params: filters }).then((r) => r.data.data),

  create: (payload: { title: string; dueAt: string; type?: TaskType }) =>
    api.post<{ success: boolean; data: Task }>("/tasks", payload).then((r) => r.data.data),

  toggle: (id: string) => api.put<{ success: boolean; data: Task }>(`/tasks/${id}/toggle`).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

import { api } from "./axios";
import type { Discussion, DiscussionComment } from "@/types";

export const discussionApi = {
  list: (startupId: string, category?: string) =>
    api
      .get<{ success: boolean; data: Discussion[] }>(`/startups/${startupId}/discussions`, { params: { category } })
      .then((r) => r.data.data),

  create: (startupId: string, payload: { title: string; body: string; category: Discussion["category"] }) =>
    api
      .post<{ success: boolean; data: Discussion }>(`/startups/${startupId}/discussions`, payload)
      .then((r) => r.data.data),

  toggleLike: (discussionId: string) =>
    api
      .put<{ success: boolean; liked: boolean; likeCount: number }>(`/discussions/${discussionId}/like`)
      .then((r) => r.data),

  report: (discussionId: string, reason?: string) =>
    api
      .post<{ success: boolean; message: string }>(`/discussions/${discussionId}/report`, { reason })
      .then((r) => r.data),

  listComments: (discussionId: string) =>
    api
      .get<{ success: boolean; data: DiscussionComment[] }>(`/discussions/${discussionId}/comments`)
      .then((r) => r.data.data),

  createComment: (discussionId: string, body: string) =>
    api
      .post<{ success: boolean; data: DiscussionComment }>(`/discussions/${discussionId}/comments`, { body })
      .then((r) => r.data.data),
};

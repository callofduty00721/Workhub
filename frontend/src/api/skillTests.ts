import { api } from "./axios";

export interface SkillTestSummary {
  _id: string;
  skill: string;
  description?: string;
  passingScorePercent: number;
  questionCount: number;
  passed: boolean;
}

export interface SkillTestQuestion {
  question: string;
  options: string[];
}

export interface SkillTestToTake {
  _id: string;
  skill: string;
  description?: string;
  passingScorePercent: number;
  questions: SkillTestQuestion[];
}

export interface SkillTestResult {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
}

export interface VerifiedSkill {
  skill: string;
  scorePercent: number;
}

export interface AdminSkillTestQuestion extends SkillTestQuestion {
  correctIndex: number;
}

export interface AdminSkillTest {
  _id: string;
  skill: string;
  description?: string;
  questions: AdminSkillTestQuestion[];
  passingScorePercent: number;
  isActive: boolean;
  createdAt: string;
}

export const skillTestApi = {
  list: () => api.get<{ success: boolean; data: SkillTestSummary[] }>("/skill-tests").then((r) => r.data.data),

  start: (id: string) => api.get<{ success: boolean; data: SkillTestToTake }>(`/skill-tests/${id}/start`).then((r) => r.data.data),

  submit: (id: string, answers: number[]) =>
    api.post<{ success: boolean; data: SkillTestResult }>(`/skill-tests/${id}/submit`, { answers }).then((r) => r.data.data),
};

export const adminSkillTestApi = {
  list: () => api.get<{ success: boolean; data: AdminSkillTest[] }>("/admin/skill-tests").then((r) => r.data.data),

  create: (payload: Partial<AdminSkillTest>) =>
    api.post<{ success: boolean; data: AdminSkillTest }>("/admin/skill-tests", payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<AdminSkillTest>) =>
    api.put<{ success: boolean; data: AdminSkillTest }>(`/admin/skill-tests/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/admin/skill-tests/${id}`).then((r) => r.data),
};

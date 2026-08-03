import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Plus, Trash2, Loader2, GraduationCap, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminSkillTestApi, type AdminSkillTestQuestion } from "@/api/skillTests";

const EMPTY_QUESTION = (): AdminSkillTestQuestion => ({ question: "", options: ["", "", "", ""], correctIndex: 0 });

export default function AdminSkillTests() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [skill, setSkill] = useState("");
  const [description, setDescription] = useState("");
  const [passingScorePercent, setPassingScorePercent] = useState(70);
  const [questions, setQuestions] = useState<AdminSkillTestQuestion[]>([EMPTY_QUESTION()]);
  const [error, setError] = useState<string | null>(null);

  const { data: tests, isLoading } = useQuery({ queryKey: ["admin", "skill-tests"], queryFn: adminSkillTestApi.list });

  const resetForm = () => {
    setSkill("");
    setDescription("");
    setPassingScorePercent(70);
    setQuestions([EMPTY_QUESTION()]);
    setCreating(false);
    setError(null);
  };

  const createMutation = useMutation({
    mutationFn: () => adminSkillTestApi.create({ skill, description, passingScorePercent, questions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skill-tests"] });
      resetForm();
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Failed to create test" : "Something went wrong"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminSkillTestApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "skill-tests"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminSkillTestApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "skill-tests"] }),
  });

  const updateQuestion = (qi: number, patch: Partial<AdminSkillTestQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, idx) => (idx === oi ? value : o)) } : q)));

  return (
    <DashboardLayout role="super_admin" title="Skill Tests" subtitle="Manage the skill assessments freelancers can take to earn verified badges.">
      {!creating ? (
        <Button variant="gradient" size="sm" className="mb-6" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" /> New Skill Test
        </Button>
      ) : (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">New Skill Test</h3>
              <button type="button" onClick={resetForm}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Skill Name</Label>
                <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. React" />
              </div>
              <div className="space-y-1.5">
                <Label>Passing Score (%)</Label>
                <Input type="number" min={1} max={100} value={passingScorePercent} onChange={(e) => setPassingScorePercent(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
            </div>

            <div className="space-y-3">
              {questions.map((q, qi) => (
                <div key={qi} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Question {qi + 1}</span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={q.question}
                    onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                    placeholder="Question text"
                    className="h-8 text-xs"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(qi, { correctIndex: oi })}
                          className="h-3.5 w-3.5 shrink-0"
                          title="Mark as correct answer"
                        />
                        <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setQuestions((prev) => [...prev, EMPTY_QUESTION()])}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add question
              </button>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}
            <Button
              variant="gradient"
              disabled={!skill.trim() || questions.length < 3 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Test
            </Button>
            {questions.length < 3 && <p className="text-xs text-muted-foreground">Add at least 3 questions.</p>}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !tests?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No skill tests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => (
            <Card key={t._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{t.skill}</p>
                    <Badge variant={t.isActive ? "success" : "outline"} className="text-[10px]">
                      {t.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.questions.length} questions · {t.passingScorePercent}% to pass
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={toggleActiveMutation.isPending}
                    onClick={() => toggleActiveMutation.mutate({ id: t._id, isActive: !t.isActive })}
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(t._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

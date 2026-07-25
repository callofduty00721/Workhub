import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { GraduationCap, CheckCircle2, Loader2, ArrowLeft, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { skillTestApi, type SkillTestToTake, type SkillTestResult } from "@/api/skillTests";
import { cn } from "@/lib/utils";

export default function SkillTests() {
  const queryClient = useQueryClient();
  const [activeTest, setActiveTest] = useState<SkillTestToTake | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<SkillTestResult | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const { data: tests, isLoading } = useQuery({ queryKey: ["skill-tests"], queryFn: skillTestApi.list });

  const startMutation = useMutation({
    mutationFn: (id: string) => skillTestApi.start(id),
    onSuccess: (test) => {
      setActiveTest(test);
      setAnswers(new Array(test.questions.length).fill(null));
      setResult(null);
      setStartError(null);
    },
    onError: (err) => setStartError(isAxiosError(err) ? err.response?.data?.message || "Could not start this test" : "Something went wrong"),
  });

  const submitMutation = useMutation({
    mutationFn: () => skillTestApi.submit(activeTest!._id, answers as number[]),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["skill-tests"] });
    },
  });

  const closeTest = () => {
    setActiveTest(null);
    setAnswers([]);
    setResult(null);
  };

  if (activeTest) {
    return (
      <DashboardLayout role="freelancer" title={`${activeTest.skill} Skill Test`} subtitle={activeTest.description}>
        <Button variant="ghost" size="sm" className="mb-4" onClick={closeTest}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tests
        </Button>

        {result ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              {result.passed ? (
                <CheckCircle2 className="h-10 w-10 text-success" />
              ) : (
                <XCircle className="h-10 w-10 text-danger" />
              )}
              <p className="text-lg font-semibold">{result.passed ? "You passed!" : "Not quite — try again later"}</p>
              <p className="text-sm text-muted-foreground">
                You scored {result.scorePercent}% ({result.correctCount}/{result.totalQuestions} correct), needed{" "}
                {activeTest.passingScorePercent}% to pass.
              </p>
              {result.passed && <p className="text-xs text-muted-foreground">A verified badge for {activeTest.skill} now shows on your profile.</p>}
              <Button variant="gradient" onClick={closeTest} className="mt-2">
                Done
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-6 p-6">
              {activeTest.questions.map((q, qi) => (
                <div key={qi} className="space-y-2">
                  <p className="text-sm font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                          answers[qi] === oi ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                        )}
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={answers[qi] === oi}
                          onChange={() => setAnswers((prev) => prev.map((a, idx) => (idx === qi ? oi : a)))}
                          className="h-3.5 w-3.5"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                variant="gradient"
                className="w-full"
                disabled={answers.some((a) => a === null) || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Test
              </Button>
            </CardContent>
          </Card>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="freelancer" title="Skill Tests" subtitle="Pass a test to earn a verified skill badge on your profile.">
      {startError && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{startError}</div>}
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
            <p className="text-sm font-medium">No skill tests available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => (
            <Card key={t._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{t.skill}</p>
                    {t.passed && (
                      <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Passed
                      </Badge>
                    )}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.questionCount} questions · {t.passingScorePercent}% to pass
                  </p>
                </div>
                <Button variant={t.passed ? "outline" : "gradient"} size="sm" disabled={startMutation.isPending} onClick={() => startMutation.mutate(t._id)}>
                  {startMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {t.passed ? "Retake" : "Start Test"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

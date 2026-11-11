import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUIZ_LENGTH, QUIZ_PASS_MARK, drawQuiz, isQuizPass } from "@/game/missions/mission01/quiz";
import { recordQuizAttempt, setPhase } from "@/game/missions/mission01/state";
import { isEditableTarget } from "@/game/core/input";
import { cn } from "@/lib/utils";
import { OverlayFrame } from "./OverlayFrame";

export function QuizOverlay({ onClose }: { onClose: () => void }) {
  const [questions, setQuestions] = useState(() => drawQuiz());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const recorded = useRef(false);
  const q = questions[index] ?? questions[0]!;

  const choose = (i: number) => {
    if (selected !== null || finished) return;
    setSelected(i);
    if (i === q.correctIndex) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (index + 1 < QUIZ_LENGTH) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setFinished(true);
      if (!recorded.current) {
        recorded.current = true;
        recordQuizAttempt(correct);
      }
    }
  };

  const retry = () => {
    setQuestions(drawQuiz());
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
    recorded.current = false;
  };

  // Number keys 1–4 pick an answer (ignored while a form field has focus).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target) || finished || selected !== null) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) choose(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished) {
    const passed = isQuizPass(correct);
    return (
      <OverlayFrame kicker="Certification" title={passed ? "Certification passed" : "Not passed yet"} onClose={onClose}>
        <div className="space-y-4">
          <p className="font-display text-4xl">
            {correct}
            <span className="text-muted-foreground">/{QUIZ_LENGTH}</span>
          </p>
          <p className={cn("text-sm", passed ? "text-success" : "text-amber")}>
            {passed
              ? "You've shown you understand the equipment that keeps you alive."
              : `You need ${QUIZ_PASS_MARK} of ${QUIZ_LENGTH}. Review the science notes in the Prep Bay or try again right away — new questions may appear.`}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {passed ? (
              <>
                <Button variant="hud" onClick={onClose}>
                  Back to Prep Bay
                </Button>
                <Button variant="mission" data-autofocus onClick={() => setPhase("evaluation")}>
                  Proceed to mission evaluation
                </Button>
              </>
            ) : (
              <>
                <Button variant="hud" onClick={onClose}>
                  Review in Prep Bay
                </Button>
                <Button variant="mission" data-autofocus onClick={retry}>
                  Retry quiz
                </Button>
              </>
            )}
          </div>
        </div>
      </OverlayFrame>
    );
  }

  return (
    <OverlayFrame kicker={`Question ${index + 1} of ${QUIZ_LENGTH}`} title="Certification quiz" onClose={onClose} wide>
      <div className="space-y-4" key={q.id}>
        <p className="text-base font-medium">{q.prompt}</p>
        <div className="grid gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isPicked = i === selected;
            return (
              <Button
                key={opt}
                variant="choice"
                className={cn(
                  "p-3",
                  selected !== null && isCorrect && "border-success bg-success/10",
                  selected !== null && isPicked && !isCorrect && "border-destructive bg-destructive/10",
                )}
                data-autofocus={i === 0 ? true : undefined}
                disabled={selected !== null && !isPicked && !isCorrect}
                onClick={() => choose(i)}
              >
                <span className="flex w-full items-start gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className="flex-1">{opt}</span>
                  {selected !== null && isCorrect && <CheckCircle2 className="size-4 text-success" aria-label="Correct answer" />}
                  {selected !== null && isPicked && !isCorrect && <XCircle className="size-4 text-destructive" aria-label="Your answer" />}
                </span>
              </Button>
            );
          })}
        </div>
        {selected !== null && (
          <div className="animate-fade-up rounded-md border border-border bg-panel-strong p-3 text-sm" aria-live="polite">
            <p className={cn("font-semibold", selected === q.correctIndex ? "text-success" : "text-amber")}>
              {selected === q.correctIndex ? "Correct." : "Not quite."}
            </p>
            <p className="mt-1 text-foreground/90">{q.explanation}</p>
            <div className="mt-3 flex justify-end">
              <Button variant="mission" onClick={next} autoFocus>
                {index + 1 < QUIZ_LENGTH ? "Next question" : "See result"}
              </Button>
            </div>
          </div>
        )}
        <p className="hud-label">Tip: press 1–4 to answer</p>
      </div>
    </OverlayFrame>
  );
}

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuizStore } from "@/store/useQuizStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QuizQuestion, QuizAnswer } from "@shared/schema";
import { Clock, Flag, ChevronLeft, ChevronRight, X } from "lucide-react";

export function QuizTakingModal() {
  const { toast } = useToast();
  const {
    isQuizModalOpen,
    currentQuestion,
    currentQuiz,
    answers,
    timeSpent,
    setQuizModalOpen,
    setCurrentQuestion,
    updateAnswer,
    setTimeSpent,
    resetQuiz,
  } = useQuizStore();

  const [startTime] = useState(Date.now());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const submitMutation = useMutation({
    mutationFn: async (data: { answers: QuizAnswer[]; timeSpent: number }) => {
      if (!currentQuiz) throw new Error("No quiz available");
      const res = await apiRequest("POST", `/api/quiz/${currentQuiz.id}/submit`, data);
      return res.json();
    },
    onSuccess: (result) => {
      setQuizModalOpen(false);
      resetQuiz();
      toast({
        title: "Quiz submitted successfully!",
        description: `You scored ${parseFloat(result.attempt.score).toFixed(1)}%`,
      });
      // Navigate to results page
      window.location.href = `/result/${result.attempt.id}`;
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update time spent every second
  useEffect(() => {
    if (!isQuizModalOpen) return;

    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isQuizModalOpen, startTime, setTimeSpent]);

  if (!currentQuiz || !isQuizModalOpen) {
    return null;
  }

  const questions = currentQuiz.questions as QuizQuestion[];
  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerChange = (value: string) => {
    updateAnswer(currentQuestionData.id, value);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (flaggedQuestions.has(currentQuestionData.id)) {
      newFlagged.delete(currentQuestionData.id);
    } else {
      newFlagged.add(currentQuestionData.id);
    }
    setFlaggedQuestions(newFlagged);
  };

  const handleSubmit = () => {
    const formattedAnswers: QuizAnswer[] = questions.map(q => {
      const userAnswer = answers.find(a => a.questionId === q.id);
      return {
        questionId: q.id,
        answer: userAnswer?.answer || "",
        isCorrect: userAnswer?.answer === q.correctAnswer,
      };
    });

    submitMutation.mutate({
      answers: formattedAnswers,
      timeSpent,
    });
  };

  const handleClose = () => {
    setQuizModalOpen(false);
    resetQuiz();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentAnswer = () => {
    const answer = answers.find(a => a.questionId === currentQuestionData.id);
    return answer?.answer || "";
  };

  return (
    <Dialog open={isQuizModalOpen} onOpenChange={setQuizModalOpen}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto p-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{currentQuiz.title}</h3>
              <p className="text-slate-600">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-2 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        {/* Question Content */}
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900 flex-1">
                {currentQuestionData.question}
              </h4>
              {flaggedQuestions.has(currentQuestionData.id) && (
                <Flag className="w-5 h-5 text-amber-500 fill-current ml-4 flex-shrink-0" />
              )}
            </div>
            
            {/* Multiple Choice Questions */}
            {currentQuestionData.type === "multiple_choice" && currentQuestionData.options && (
              <RadioGroup
                value={getCurrentAnswer()}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                {currentQuestionData.options.map((option, index) => (
                  <div key={index} className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" />
                    <Label htmlFor={`option-${index}`} className="ml-4 text-slate-700 cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* True/False Questions */}
            {currentQuestionData.type === "true_false" && (
              <RadioGroup
                value={getCurrentAnswer()}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                <div className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <RadioGroupItem value="true" id="true" className="w-5 h-5" />
                  <Label htmlFor="true" className="ml-4 text-slate-700 cursor-pointer flex-1">True</Label>
                </div>
                <div className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <RadioGroupItem value="false" id="false" className="w-5 h-5" />
                  <Label htmlFor="false" className="ml-4 text-slate-700 cursor-pointer flex-1">False</Label>
                </div>
              </RadioGroup>
            )}

            {/* Fill in the Blank Questions */}
            {currentQuestionData.type === "fill_blank" && (
              <div className="space-y-4">
                <Label htmlFor="fill-answer" className="text-sm font-medium text-slate-700">
                  Your Answer:
                </Label>
                <Input
                  id="fill-answer"
                  type="text"
                  value={getCurrentAnswer()}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 text-lg"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-6 py-2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleFlag}
                className={`px-6 py-2 ${
                  flaggedQuestions.has(currentQuestionData.id)
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : ""
                }`}
              >
                <Flag className="w-4 h-4 mr-2" />
                {flaggedQuestions.has(currentQuestionData.id) ? "Unflag" : "Flag for Review"}
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="px-6 py-2 bg-primary hover:bg-primary/90"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary hover:bg-primary/90"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Status Indicator */}
          {flaggedQuestions.size > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <Flag className="w-4 h-4 inline mr-1" />
                {flaggedQuestions.size} question{flaggedQuestions.size !== 1 ? 's' : ''} flagged for review
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

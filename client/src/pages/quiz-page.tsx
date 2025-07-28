import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { QuizQuestion, QuizAnswer } from "@shared/schema";
import { Clock, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuizPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  const { data: quiz, isLoading } = useQuery<{
    id: string;
    title: string;
    questions: QuizQuestion[];
    difficultyLevel: string;
    timeLimit?: number;
  }>({
    queryKey: ["/api/quiz", id],
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { answers: QuizAnswer[]; timeSpent: number }) => {
      const res = await apiRequest("POST", `/api/quiz/${id}/submit`, data);
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Quiz submitted!",
        description: `You scored ${result.attempt.score}%`,
      });
      // Navigate to results page
      window.location.href = `/result/${result.attempt.id}`;
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-slate-600">Quiz not found</p>
        </div>
      </div>
    );
  }

  const questions = quiz.questions as QuizQuestion[];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers: QuizAnswer[] = questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || "",
      isCorrect: answers[q.id] === q.correctAnswer,
    }));

    submitMutation.mutate({
      answers: formattedAnswers,
      timeSpent,
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
                <p className="text-slate-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeSpent)}</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {currentQuestion.question}
              </h2>
              
              {currentQuestion.type === "multiple_choice" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={handleAnswerChange}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "true_false" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={handleAnswerChange}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                  </div>
                </RadioGroup>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Flag className="w-4 h-4 mr-2" />
                  Flag for Review
                </Button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

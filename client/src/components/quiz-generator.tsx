import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { QuizPreview } from "@/components/quiz-preview";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";

interface QuizGenerationParams {
  materialId: string;
  questionCount: number;
  questionTypes: string[];
  difficultyLevel: string;
  title: string;
}

export function QuizGenerator() {
  const { toast } = useToast();
  const [params, setParams] = useState<QuizGenerationParams>({
    materialId: "",
    questionCount: 15,
    questionTypes: ["multiple_choice", "true_false"],
    difficultyLevel: "intermediate",
    title: "",
  });
  const [generatedQuiz, setGeneratedQuiz] = useState<{
    id: string;
    title: string;
    questions: Array<any>;
    difficultyLevel: string;
  } | null>(null);

  const { data: materials = [] } = useQuery<Array<{
    id: string;
    name: string;
    originalName: string;
    status: string;
    extractedText?: string;
  }>>({
    queryKey: ["/api/materials"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: QuizGenerationParams) => {
      const res = await apiRequest("POST", "/api/quiz/generate", data);
      return res.json();
    },
    onSuccess: (quiz) => {
      setGeneratedQuiz(quiz);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz generated successfully!",
        description: `Created "${quiz.title}" with ${quiz.questions.length} questions.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const res = await apiRequest("PUT", `/api/quiz/${quizId}/publish`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz published!",
        description: "Students can now access this quiz.",
      });
    },
  });

  const processedMaterials = materials.filter(m => m.status === "processed");

  const handleGenerate = () => {
    if (!params.materialId) {
      toast({
        title: "Please select a material",
        description: "Choose a processed material to generate quiz from.",
        variant: "destructive",
      });
      return;
    }

    if (!params.title.trim()) {
      toast({
        title: "Please enter a quiz title",
        description: "Give your quiz a descriptive title.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(params);
  };

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    setParams(prev => ({
      ...prev,
      questionTypes: checked
        ? [...prev.questionTypes, type]
        : prev.questionTypes.filter(t => t !== type)
    }));
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Generate AI-Powered Quiz</h3>
        <p className="text-slate-600">Create engaging quizzes from your uploaded materials using advanced AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="material-select">Select Material</Label>
                <Select value={params.materialId} onValueChange={(value) => setParams({...params, materialId: value})}>
                  <SelectTrigger id="material-select">
                    <SelectValue placeholder="Choose a material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {processedMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {processedMaterials.length === 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    No processed materials available. Upload and process materials first.
                  </p>
                )}
              </div>

              <div>
                <Label>Question Types</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiple-choice"
                      checked={params.questionTypes.includes("multiple_choice")}
                      onCheckedChange={(checked) => handleQuestionTypeChange("multiple_choice", checked as boolean)}
                    />
                    <Label htmlFor="multiple-choice">Multiple Choice</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="true-false"
                      checked={params.questionTypes.includes("true_false")}
                      onCheckedChange={(checked) => handleQuestionTypeChange("true_false", checked as boolean)}
                    />
                    <Label htmlFor="true-false">True/False</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fill-blank"
                      checked={params.questionTypes.includes("fill_blank")}
                      onCheckedChange={(checked) => handleQuestionTypeChange("fill_blank", checked as boolean)}
                    />
                    <Label htmlFor="fill-blank">Fill in the Blank</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="question-count">Number of Questions</Label>
                <div className="mt-2">
                  <Slider
                    id="question-count"
                    min={5}
                    max={50}
                    step={1}
                    value={[params.questionCount]}
                    onValueChange={(value) => setParams({...params, questionCount: value[0]})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5</span>
                    <span className="font-medium">{params.questionCount}</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={params.difficultyLevel} onValueChange={(value) => setParams({...params, difficultyLevel: value})}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                    <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                    <SelectItem value="mixed">Mixed Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  type="text"
                  placeholder="e.g., Grammar Fundamentals Quiz"
                  value={params.title}
                  onChange={(e) => setParams({...params, title: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !params.materialId || !params.title.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary-600 hover:from-primary/90 hover:to-secondary-600/90"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? "Generating..." : "Generate Quiz"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          {generatedQuiz ? (
            <QuizPreview 
              quiz={generatedQuiz} 
              onPublish={() => publishMutation.mutate(generatedQuiz.id)}
              isPublishing={publishMutation.isPending}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Wand2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Quiz Preview</h4>
                <p className="text-slate-600">
                  Configure your quiz settings and click "Generate Quiz" to see a preview of your AI-generated questions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

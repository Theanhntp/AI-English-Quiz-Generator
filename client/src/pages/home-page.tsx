import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/file-drop-zone";
import { QuizGenerator } from "@/components/quiz-generator";
import { ResultsAnalytics } from "@/components/results-analytics";
import { QuizTakingModal } from "@/components/quiz-taking-modal";
import { useQuizStore } from "@/store/useQuizStore";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FileText, ClipboardList, Users, TrendingUp, Plus } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useQuizStore();

  const { data: stats } = useQuery<{
    totalMaterials: number;
    totalQuizzes: number; 
    totalAttempts: number;
    avgScore: number;
  }>({
    queryKey: ["/api/analytics/stats"],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="text-slate-600 mt-1">Ready to create engaging quizzes with AI?</p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Create Quiz</span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Materials</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalMaterials || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Generated Quizzes</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalQuizzes || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-secondary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Quiz Attempts</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalAttempts || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg. Score</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.avgScore ? `${stats.avgScore}%` : "0%"}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-slate-200">
              <TabsList className="w-full justify-start rounded-none border-none bg-transparent p-0">
                <TabsTrigger 
                  value="materials" 
                  className="border-b-2 border-transparent py-4 px-6 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Materials
                </TabsTrigger>
                <TabsTrigger 
                  value="generate" 
                  className="border-b-2 border-transparent py-4 px-6 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Generate Quiz
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="border-b-2 border-transparent py-4 px-6 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Results
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="materials" className="p-6">
              <FileDropZone />
            </TabsContent>

            <TabsContent value="generate" className="p-6">
              <QuizGenerator />
            </TabsContent>

            <TabsContent value="results" className="p-6">
              <ResultsAnalytics />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <QuizTakingModal />
    </div>
  );
}

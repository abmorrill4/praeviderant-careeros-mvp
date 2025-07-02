
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic } from "lucide-react";
import SimpleVoiceInterview from "./SimpleVoiceInterview";
import { SmartInterviewFlow } from "./SmartInterviewFlow";

const AIInterviewPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-career-text mb-2">
          AI Career Interview
        </h2>
        <p className="text-lg text-career-text-muted">
          Have a natural conversation about your career
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="smart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smart">Smart Interview</TabsTrigger>
              <TabsTrigger value="voice">Voice Interview</TabsTrigger>
            </TabsList>
            <TabsContent value="smart" className="mt-4">
              <SmartInterviewFlow interviewType="general" />
            </TabsContent>
            <TabsContent value="voice" className="mt-4">
              <SimpleVoiceInterview />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="bg-career-panel border-career-text/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-career-text">
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-career-text-muted">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">1.</span>
                  <span>Click "Start Interview"</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">2.</span>
                  <span>The AI will greet you and begin asking questions</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">3.</span>
                  <span>Speak naturally about your experience</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-career-accent font-bold">4.</span>
                  <span>Your responses will be saved and analyzed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-career-panel border-career-text/20">
            <CardContent className="p-6 text-center">
              <Mic className="w-12 h-12 mx-auto mb-3 text-career-text-muted" />
              <p className="text-sm text-career-text-muted">
                The interview will start automatically once you connect. Just speak naturally when prompted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewPage;

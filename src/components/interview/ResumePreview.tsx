
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumePreviewProps {
  extractedData: any;
  theme: 'light' | 'dark';
}

export const ResumePreview = ({ extractedData, theme }: ResumePreviewProps) => {
  const generateMarkdown = () => {
    let markdown = "# Resume\n\n";
    
    if (extractedData.welcome) {
      markdown += "## Profile\n";
      markdown += `${extractedData.welcome.summary || 'Your profile summary will appear here...'}\n\n`;
    }
    
    if (extractedData.work_history) {
      markdown += "## Work Experience\n";
      markdown += `${extractedData.work_history.summary || 'Your work experience will appear here...'}\n\n`;
    }
    
    if (extractedData.education) {
      markdown += "## Education\n";
      markdown += `${extractedData.education.summary || 'Your education background will appear here...'}\n\n`;
    }
    
    if (extractedData.skills) {
      markdown += "## Skills\n";
      markdown += `${extractedData.skills.summary || 'Your skills will appear here...'}\n\n`;
    }
    
    if (extractedData.achievements) {
      markdown += "## Key Achievements\n";
      markdown += `${extractedData.achievements.summary || 'Your achievements will appear here...'}\n\n`;
    }
    
    if (extractedData.career_goals) {
      markdown += "## Career Objectives\n";
      markdown += `${extractedData.career_goals.summary || 'Your career goals will appear here...'}\n\n`;
    }
    
    return markdown;
  };

  const downloadMarkdown = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isEmpty = Object.keys(extractedData).length === 0;

  return (
    <Card className={`sticky top-6 ${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center space-x-2`}>
          <FileText className="w-5 h-5" />
          <span>Live Resume Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Your resume will appear here as you complete interview sections</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`max-h-96 overflow-y-auto prose prose-sm ${theme === 'dark' ? 'prose-invert' : ''}`}>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-gray-dark/20' : 'bg-career-gray-light/20'}`}>
                <pre className={`whitespace-pre-wrap text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  {generateMarkdown()}
                </pre>
              </div>
            </div>
            
            <Button 
              onClick={downloadMarkdown}
              variant="outline"
              className={`w-full ${theme === 'dark' ? 'border-career-text-dark/20 text-career-text-dark hover:bg-career-text-dark/10' : 'border-career-text-light/20 text-career-text-light hover:bg-career-text-light/10'}`}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Markdown
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

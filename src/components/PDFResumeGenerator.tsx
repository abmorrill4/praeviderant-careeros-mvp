
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2, Printer } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useToast } from '@/hooks/use-toast';

interface PDFResumeGeneratorProps {
  resumeData: any;
  className?: string;
}

export const PDFResumeGenerator: React.FC<PDFResumeGeneratorProps> = ({
  resumeData,
  className = ''
}) => {
  const [format, setFormat] = useState<'A4' | 'Letter'>('A4');
  const { generatePDF, isGenerating, error } = usePDFGeneration();
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!resumeData) {
      toast({
        title: "No Resume Data",
        description: "Please provide resume data to generate a PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      const htmlBlob = await generatePDF(resumeData, { format });
      
      // Open the HTML in a new tab for printing
      const url = URL.createObjectURL(htmlBlob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Give the page time to load, then trigger print dialog
        setTimeout(() => {
          newWindow.print();
        }, 1000);
      }

      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);

      toast({
        title: "Resume Ready for Print",
        description: "Your resume has opened in a new tab. Use Ctrl+P (or Cmd+P) and select 'Save as PDF' to download.",
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: error || "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate PDF Resume
        </CardTitle>
        <CardDescription>
          Export your resume as a professionally formatted PDF document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Paper Format</label>
          <Select value={format} onValueChange={(value: 'A4' | 'Letter') => setFormat(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
              <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <Printer className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">How to save as PDF:</p>
              <p className="text-xs mt-1">
                Click the button below to open your resume in a new tab, then use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF" as the destination.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleGeneratePDF} 
          disabled={isGenerating || !resumeData}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Open Resume for Print
            </>
          )}
        </Button>

        {resumeData && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>Resume for: <strong>{resumeData.basics?.name || 'Untitled'}</strong></p>
            <p>Sections: {Object.keys(resumeData).filter(key => 
              resumeData[key] && (Array.isArray(resumeData[key]) ? resumeData[key].length > 0 : true)
            ).length}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2 } from 'lucide-react';
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
      const pdfBlob = await generatePDF(resumeData, { format });
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeData.basics?.name || 'resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated",
        description: "Your resume PDF has been downloaded successfully",
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: error || "Failed to generate PDF. Please try again.",
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

        <Button 
          onClick={handleGeneratePDF} 
          disabled={isGenerating || !resumeData}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF Resume
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

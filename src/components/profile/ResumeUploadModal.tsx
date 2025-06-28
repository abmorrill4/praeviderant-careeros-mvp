
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { ResumeUpload } from '@/components/resume-upload/ResumeUpload';

interface ResumeUploadModalProps {
  children?: React.ReactNode;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ children }) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            size="sm"
            className={`${
              theme === 'dark' 
                ? 'border-career-gray-dark hover:bg-career-gray-dark text-career-text-dark' 
                : 'border-career-gray-light hover:bg-career-gray-light text-career-text-light'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
          theme === 'dark' 
            ? 'bg-career-panel-dark border-career-gray-dark' 
            : 'bg-career-panel-light border-career-gray-light'
        }`}
      >
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${
            theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
          }`}>
            <FileText className="w-5 h-5" />
            Upload Resume
          </DialogTitle>
          <DialogDescription className={
            theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
          }>
            Upload your resume to automatically extract and organize your career data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <ResumeUpload />
        </div>
      </DialogContent>
    </Dialog>
  );
};

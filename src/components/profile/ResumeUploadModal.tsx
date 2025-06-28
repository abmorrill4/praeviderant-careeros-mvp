
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ResumeUpload } from '@/components/resume-upload/ResumeUpload';

export const ResumeUploadModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Your Resume</DialogTitle>
          <DialogDescription>
            Upload your resume to automatically extract and organize your career data.
          </DialogDescription>
        </DialogHeader>
        <ResumeUpload />
      </DialogContent>
    </Dialog>
  );
};

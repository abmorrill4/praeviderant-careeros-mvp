
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface VoiceVisualizerProps {
  isRecording: boolean;
  theme: 'light' | 'dark';
}

export const VoiceVisualizer = ({ isRecording, theme }: VoiceVisualizerProps) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      // Generate random audio levels for visualization
      const newLevels = Array.from({ length: 20 }, () => Math.random() * 100);
      setAudioLevels(newLevels);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-center space-x-1 h-16">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className={`w-1 bg-career-accent transition-all duration-100 ease-out rounded-full`}
              style={{
                height: `${Math.max(4, (level / 100) * 60)}px`,
                opacity: isRecording ? 0.7 + (level / 100) * 0.3 : 0.3
              }}
            />
          ))}
        </div>
        <div className="text-center mt-2">
          <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            {isRecording ? "Listening..." : "Ready to record"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

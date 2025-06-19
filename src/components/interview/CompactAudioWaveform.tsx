
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface CompactAudioWaveformProps {
  isPlaying: boolean;
  isListening: boolean;
  isThinking: boolean;
  audioData?: Float32Array;
}

const CompactAudioWaveform = ({ 
  isPlaying, 
  isListening, 
  isThinking, 
  audioData 
}: CompactAudioWaveformProps) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [barHeights, setBarHeights] = useState<number[]>(Array(20).fill(0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barHeights.length;
      const centerY = height / 2;

      barHeights.forEach((barHeight, index) => {
        const x = index * barWidth;
        const barHeightPx = barHeight * centerY * 0.6;

        let color;
        if (isPlaying) {
          color = theme === 'dark' ? '#4fdbc3' : '#2a8a7a';
        } else if (isListening) {
          color = theme === 'dark' ? '#60a5fa' : '#3b82f6';
        } else if (isThinking) {
          color = theme === 'dark' ? '#fbbf24' : '#f59e0b';
        } else {
          color = theme === 'dark' ? '#4a5568' : '#9ca3af';
        }

        ctx.fillStyle = color;
        ctx.fillRect(x + 1, centerY - barHeightPx, barWidth - 2, barHeightPx * 2);
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [barHeights, theme, isPlaying, isListening, isThinking]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setBarHeights(prev => prev.map(() => 
          Math.random() * 0.8 + 0.2
        ));
      }, 100);
    } else if (isListening) {
      interval = setInterval(() => {
        setBarHeights(prev => prev.map((_, i) => 
          0.2 + Math.sin(Date.now() * 0.003 + i * 0.3) * 0.15
        ));
      }, 50);
    } else if (isThinking) {
      interval = setInterval(() => {
        setBarHeights(prev => prev.map((_, i) => 
          0.1 + Math.sin(Date.now() * 0.005 + i * 0.4) * 0.2
        ));
      }, 75);
    } else {
      setBarHeights(Array(20).fill(0.1));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isListening, isThinking]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show only when there's activity
  if (!isPlaying && !isListening && !isThinking) {
    return null;
  }

  return (
    <div className={`w-full h-12 mb-4 ${
      theme === 'dark' 
        ? 'bg-career-gray-dark/10' 
        : 'bg-career-gray-light/10'
    } rounded-lg overflow-hidden`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default CompactAudioWaveform;

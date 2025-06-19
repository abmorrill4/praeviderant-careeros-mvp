
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioWaveformProps {
  isPlaying: boolean;
  isListening: boolean;
  isThinking: boolean;
  audioData?: Float32Array;
  className?: string;
}

const AudioWaveform = ({ 
  isPlaying, 
  isListening, 
  isThinking, 
  audioData, 
  className = "" 
}: AudioWaveformProps) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [barHeights, setBarHeights] = useState<number[]>(Array(40).fill(0.1));

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
        const barHeightPx = barHeight * centerY * 0.8;

        // Set colors based on theme and state
        let gradient;
        if (isPlaying) {
          gradient = ctx.createLinearGradient(0, centerY - barHeightPx, 0, centerY + barHeightPx);
          if (theme === 'dark') {
            gradient.addColorStop(0, '#4fdbc3');
            gradient.addColorStop(1, '#3cb8a8');
          } else {
            gradient.addColorStop(0, '#4fdbc3');
            gradient.addColorStop(1, '#2a8a7a');
          }
        } else if (isListening) {
          gradient = ctx.createLinearGradient(0, centerY - barHeightPx, 0, centerY + barHeightPx);
          if (theme === 'dark') {
            gradient.addColorStop(0, '#60a5fa');
            gradient.addColorStop(1, '#3b82f6');
          } else {
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#1d4ed8');
          }
        } else if (isThinking) {
          gradient = ctx.createLinearGradient(0, centerY - barHeightPx, 0, centerY + barHeightPx);
          if (theme === 'dark') {
            gradient.addColorStop(0, '#fbbf24');
            gradient.addColorStop(1, '#f59e0b');
          } else {
            gradient.addColorStop(0, '#f59e0b');
            gradient.addColorStop(1, '#d97706');
          }
        } else {
          gradient = theme === 'dark' ? '#a0a0a0' : '#6b7280';
        }

        ctx.fillStyle = gradient;
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

    if (isPlaying && audioData) {
      // Use real audio data when available
      const newHeights = Array.from({ length: 40 }, (_, i) => {
        const dataIndex = Math.floor((i / 40) * audioData.length);
        return Math.abs(audioData[dataIndex] || 0) * 2 + 0.1;
      });
      setBarHeights(newHeights);
    } else if (isPlaying) {
      // Simulate speaking animation
      interval = setInterval(() => {
        setBarHeights(prev => prev.map(() => 
          Math.random() * 0.8 + 0.2
        ));
      }, 100);
    } else if (isListening) {
      // Gentle pulsing for listening
      interval = setInterval(() => {
        setBarHeights(prev => prev.map((_, i) => 
          0.2 + Math.sin(Date.now() * 0.003 + i * 0.2) * 0.15
        ));
      }, 50);
    } else if (isThinking) {
      // Shimmer effect for thinking
      interval = setInterval(() => {
        setBarHeights(prev => prev.map((_, i) => 
          0.1 + Math.sin(Date.now() * 0.005 + i * 0.3) * 0.2
        ));
      }, 75);
    } else {
      // Idle state
      setBarHeights(Array(40).fill(0.1));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isListening, isThinking, audioData]);

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

  return (
    <div className={`w-full h-24 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AudioWaveform;

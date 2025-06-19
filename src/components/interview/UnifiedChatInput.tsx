
import { useState, KeyboardEvent } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { InterviewMode } from '@/hooks/useInterviewModes';
import TextInput from './TextInput';
import VoiceInputButton from './VoiceInputButton';
import InterviewModeSwitch from './InterviewModeSwitch';

interface UnifiedChatInputProps {
  mode: InterviewMode;
  isVoiceAvailable: boolean;
  isConnected: boolean;
  isProcessing: boolean;
  micEnabled: boolean;
  isRecording: boolean;
  onModeToggle: () => void;
  onSendTextMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleMicrophone: () => void;
}

const UnifiedChatInput = ({
  mode,
  isVoiceAvailable,
  isConnected,
  isProcessing,
  micEnabled,
  isRecording,
  onModeToggle,
  onSendTextMessage,
  onStartRecording,
  onStopRecording,
  onToggleMicrophone,
}: UnifiedChatInputProps) => {
  const { theme } = useTheme();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Mode Switch */}
      <div className="flex justify-center">
        <InterviewModeSwitch
          mode={mode}
          onToggle={onModeToggle}
          isVoiceAvailable={isVoiceAvailable}
          disabled={isProcessing || isRecording}
        />
      </div>

      {/* Input Interface */}
      <div className={`p-4 rounded-lg border transition-all duration-200 ${
        theme === 'dark' 
          ? 'bg-career-panel-dark border-career-text-dark/20' 
          : 'bg-career-panel-light border-career-text-light/20'
      }`}>
        {mode === 'text' ? (
          <TextInput
            onSendMessage={onSendTextMessage}
            isProcessing={isProcessing}
            disabled={!isConnected}
          />
        ) : (
          <div className="flex justify-center">
            <VoiceInputButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              micEnabled={micEnabled}
              disabled={!isConnected || !isVoiceAvailable}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onToggleMic={onToggleMicrophone}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedChatInput;

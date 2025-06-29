
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Download,
  AlertTriangle,
  XCircle,
  Info,
  Bug
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stage: string;
  timestamp: string;
  metadata?: any;
}

interface LogDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  failedStage?: string;
  versionId?: string;
}

export const LogDumpModal: React.FC<LogDumpModalProps> = ({
  isOpen,
  onClose,
  logs,
  failedStage,
  versionId
}) => {
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  const filteredLogs = logs.filter(log => 
    selectedLevel === 'all' || log.level === selectedLevel
  );

  const generateLogDump = () => {
    const timestamp = new Date().toISOString();
    const header = `=== RESUME PROCESSING LOG DUMP ===
Generated: ${timestamp}
Version ID: ${versionId || 'N/A'}
Failed Stage: ${failedStage || 'N/A'}
Total Logs: ${logs.length}

`;

    const logEntries = logs.map(log => {
      const logTimestamp = new Date(log.timestamp).toISOString();
      let entry = `[${logTimestamp}] [${log.level.toUpperCase()}] [${log.stage}] ${log.message}`;
      
      if (log.metadata && Object.keys(log.metadata).length > 0) {
        entry += `\nMetadata: ${JSON.stringify(log.metadata, null, 2)}`;
      }
      
      return entry;
    }).join('\n\n');

    return header + logEntries;
  };

  const handleCopyLogs = async () => {
    try {
      const logDump = generateLogDump();
      await navigator.clipboard.writeText(logDump);
      toast({
        title: "Logs copied to clipboard",
        description: "The complete log dump has been copied and is ready to share.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy logs to clipboard. Please try the download option.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadLogs = () => {
    const logDump = generateLogDump();
    const blob = new Blob([logDump], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-processing-logs-${versionId || 'unknown'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs downloaded",
      description: "The log file has been saved to your downloads folder.",
    });
  };

  const logCounts = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Processing Failure Log Dump
          </DialogTitle>
          <DialogDescription>
            Complete logs for resume processing failure in stage: <strong>{failedStage}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Log Summary */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold">{logCounts.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-lg font-bold text-red-600">{logCounts.errors}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-lg font-bold text-yellow-600">{logCounts.warnings}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{logCounts.info}</div>
            <div className="text-xs text-muted-foreground">Info</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-600">{logCounts.debug}</div>
            <div className="text-xs text-muted-foreground">Debug</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Filter by level:</span>
          {['all', 'error', 'warn', 'info', 'debug'].map(level => (
            <Button
              key={level}
              onClick={() => setSelectedLevel(level)}
              variant={selectedLevel === level ? 'default' : 'outline'}
              size="sm"
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>

        {/* Log Content */}
        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <div key={log.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLogBadgeVariant(log.level)} className="text-xs">
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.stage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm font-mono bg-muted p-2 rounded text-wrap break-words">
                        {log.message}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                            Technical Details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  {index < filteredLogs.length - 1 && <Separator />}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No logs found for the selected filter.
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredLogs.length} of {logs.length} logs shown
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadLogs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleCopyLogs} size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copy All Logs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

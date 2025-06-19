
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import StructuredDataDisplay, { StructuredDataItem } from './StructuredDataDisplay';

interface CollapsibleDataSidebarProps {
  data: StructuredDataItem[];
  onConfirm: (id: string) => void;
  onEdit: (id: string, newValue: string) => void;
  onRemove: (id: string) => void;
}

const CollapsibleDataSidebar = ({
  data,
  onConfirm,
  onEdit,
  onRemove,
}: CollapsibleDataSidebarProps) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      {!isExpanded && (
        <Button
          onClick={() => setIsExpanded(true)}
          variant="ghost"
          size="sm"
          className={`fixed top-4 right-4 z-50 p-2 rounded-full shadow-lg ${
            theme === 'dark' 
              ? 'bg-career-panel-dark hover:bg-career-gray-dark/40 text-career-text-dark' 
              : 'bg-career-panel-light hover:bg-career-gray-light/40 text-career-text-light'
          }`}
        >
          <Info className="w-4 h-4" />
        </Button>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-40 ${
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      } ${
        theme === 'dark' 
          ? 'bg-career-panel-dark border-l border-career-text-dark/20' 
          : 'bg-career-panel-light border-l border-career-text-light/20'
      }`}>
        <div className="p-4 border-b border-gray-200/20">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
            }`}>
              Extracted Data
            </h2>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto h-full">
          <StructuredDataDisplay
            data={data}
            onConfirm={onConfirm}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        </div>
      </div>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default CollapsibleDataSidebar;

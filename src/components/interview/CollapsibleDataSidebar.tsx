
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
          className={`fixed top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all hover:shadow-xl ${
            theme === 'dark' 
              ? 'bg-career-panel-dark hover:bg-career-gray-dark/60 text-career-text-dark border border-career-gray-dark/30' 
              : 'bg-career-panel-light hover:bg-career-gray-light/60 text-career-text-light border border-career-gray-light/30 shadow-neumorphic-sm-light'
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
          ? 'bg-career-panel-dark border-l border-career-gray-dark/30 shadow-2xl' 
          : 'bg-career-panel-light border-l border-career-gray-light/30 shadow-2xl'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' 
            ? 'border-career-gray-dark/30' 
            : 'border-career-gray-light/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
              }`}>
                Extracted Data
              </h2>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
              }`}>
                Career information gathered
              </p>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'hover:bg-career-gray-dark/40' 
                  : 'hover:bg-career-gray-light/40'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto h-full pb-24">
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
          className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default CollapsibleDataSidebar;

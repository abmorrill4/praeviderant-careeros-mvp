
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit, Plus, X } from 'lucide-react';

export interface StructuredDataItem {
  id: string;
  type: 'company' | 'job_title' | 'skill' | 'tool' | 'education' | 'certification';
  value: string;
  status: 'new' | 'updated' | 'existing';
  confidence?: number;
  confirmed?: boolean;
}

interface StructuredDataDisplayProps {
  data: StructuredDataItem[];
  onConfirm: (id: string) => void;
  onEdit: (id: string, newValue: string) => void;
  onRemove: (id: string) => void;
}

const StructuredDataDisplay = ({ 
  data, 
  onConfirm, 
  onEdit, 
  onRemove 
}: StructuredDataDisplayProps) => {
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (item: StructuredDataItem) => {
    setEditingId(item.id);
    setEditValue(item.value);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onEdit(editingId, editValue.trim());
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">New</Badge>;
      case 'updated':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Updated</Badge>;
      case 'existing':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Existing</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company':
        return '🏢';
      case 'job_title':
        return '💼';
      case 'skill':
        return '⚡';
      case 'tool':
        return '🔧';
      case 'education':
        return '🎓';
      case 'certification':
        return '📜';
      default:
        return '📝';
    }
  };

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, StructuredDataItem[]>);

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          Extracted Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedData).map(([type, items]) => (
          <div key={type} className="space-y-2">
            <h4 className={`text-sm font-medium capitalize ${
              theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
            }`}>
              {getTypeIcon(type)} {type.replace('_', ' ')}s
            </h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    theme === 'dark' 
                      ? 'bg-career-gray-dark/20 hover:bg-career-gray-dark/30' 
                      : 'bg-career-gray-light/20 hover:bg-career-gray-light/30'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={`flex-1 px-2 py-1 text-sm rounded border ${
                            theme === 'dark'
                              ? 'bg-career-gray-dark border-career-text-dark/20 text-career-text-dark'
                              : 'bg-white border-career-text-light/20 text-career-text-light'
                          }`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveEdit} className="px-2 py-1 h-auto">
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="px-2 py-1 h-auto">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
                        }`}>
                          {item.value}
                        </span>
                        {getStatusBadge(item.status)}
                        {item.confidence && (
                          <span className={`text-xs ${
                            theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
                          }`}>
                            {Math.round(item.confidence * 100)}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  
                  {editingId !== item.id && (
                    <div className="flex items-center gap-1">
                      {!item.confirmed && (
                        <Button
                          size="sm"
                          onClick={() => onConfirm(item.id)}
                          className="px-2 py-1 h-auto bg-career-accent hover:bg-career-accent-dark text-white"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                        className="px-2 py-1 h-auto"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(item.id)}
                        className="px-2 py-1 h-auto text-red-500 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedData).length === 0 && (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
          }`}>
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No structured data extracted yet</p>
            <p className="text-xs mt-1">Information will appear here as you share your background</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StructuredDataDisplay;

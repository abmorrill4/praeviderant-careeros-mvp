import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Save, X, Settings } from 'lucide-react';

interface CategoryManagerProps {
  categories: Record<string, any>;
  customCategories: Record<string, string>;
  onCategoryChange: (fieldName: string, category: string) => void;
  onCreateCategory: (name: string, config: any) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  customCategories,
  onCategoryChange,
  onCreateCategory
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    onCreateCategory(newCategoryName, {
      title: newCategoryName,
      icon: newCategoryIcon || '📁',
      priority: Object.keys(categories).length + 1,
      color: 'bg-gray-100 text-gray-800'
    });
    
    setNewCategoryName('');
    setNewCategoryIcon('');
    setIsCreating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4" />
          Category Management
        </CardTitle>
        <CardDescription className="text-xs">
          Organize fields into custom categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing Categories */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(categories).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 p-2 border rounded">
                <span className="text-xs">{config.icon}</span>
                <span className="text-xs font-medium">{config.title}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {Object.values(customCategories).filter(cat => cat === key).length}
                </Badge>
              </div>
            ))}
          </div>

          {/* Create New Category */}
          {isCreating ? (
            <div className="space-y-2 p-3 border rounded bg-gray-50">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Icon (emoji or text)"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateCategory} className="h-7 text-xs">
                  <Save className="w-3 h-3 mr-1" />
                  Create
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  className="h-7 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="w-full h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Custom Category
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

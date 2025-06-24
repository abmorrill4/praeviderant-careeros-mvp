
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Edit, 
  History, 
  Check,
  X,
  Eye,
  Copy
} from 'lucide-react';
import { 
  usePromptTemplates, 
  useCreatePromptTemplate, 
  useUpdatePromptTemplate,
  usePromptTemplatesByCategory 
} from '@/hooks/usePromptTemplates';
import { PROMPT_CATEGORIES, type PromptCategory, type PromptTemplate } from '@/types/prompt-templates';

interface PromptTemplateManagerProps {
  className?: string;
}

export const PromptTemplateManager: React.FC<PromptTemplateManagerProps> = ({ className }) => {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('resume_parsing');
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<PromptTemplate | null>(null);

  const { data: allTemplates, isLoading } = usePromptTemplates();
  const { data: categoryTemplates } = usePromptTemplatesByCategory(selectedCategory);
  const createMutation = useCreatePromptTemplate();
  const updateMutation = useUpdatePromptTemplate();

  const [formData, setFormData] = useState({
    category: selectedCategory,
    content: '',
    description: '',
  });

  const handleCreateTemplate = async () => {
    if (!formData.content.trim()) return;

    await createMutation.mutateAsync({
      category: formData.category,
      content: formData.content,
      description: formData.description,
    });

    setFormData({ category: selectedCategory, content: '', description: '' });
    setIsCreating(false);
  };

  const handleUpdateTemplate = async (template: PromptTemplate, updates: any) => {
    await updateMutation.mutateAsync({
      id: template.id,
      updates,
    });
    setEditingTemplate(null);
  };

  const handleToggleActive = async (template: PromptTemplate) => {
    await updateMutation.mutateAsync({
      id: template.id,
      updates: { is_active: !template.is_active },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Prompt Template Manager</h2>
            <p className="text-muted-foreground">
              Manage versioned prompt templates for various AI processing jobs
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as PromptCategory)}>
          <TabsList className="grid w-full grid-cols-5">
            {PROMPT_CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROMPT_CATEGORIES.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {categoryTemplates?.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          Version {template.version}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {template.is_active && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {new Date(template.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => handleToggleActive(template)}
                        />
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Content: {template.content.length} characters
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!categoryTemplates || categoryTemplates.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No templates found for {category.replace('_', ' ')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Create Template Modal */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Prompt Template</CardTitle>
              <CardDescription>
                Create a new version for the selected category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as PromptCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this template version"
                />
              </div>

              <div>
                <Label htmlFor="content">Prompt Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the prompt template content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTemplate}
                  disabled={createMutation.isPending || !formData.content.trim()}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({ category: selectedCategory, content: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Template Modal */}
        {viewingTemplate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {viewingTemplate.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} v{viewingTemplate.version}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingTemplate(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {viewingTemplate.description && (
                <CardDescription>{viewingTemplate.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {viewingTemplate.content}
                  </pre>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: {new Date(viewingTemplate.created_at).toLocaleString()}</span>
                  <span>Updated: {new Date(viewingTemplate.updated_at).toLocaleString()}</span>
                  <Badge variant={viewingTemplate.is_active ? "default" : "secondary"}>
                    {viewingTemplate.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

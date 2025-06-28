
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Building, MapPin, Globe, Award, Code, Users, Heart, BookOpen, Star } from 'lucide-react';

interface DetailedViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: any;
  title: string;
  subtitle?: string;
}

export const DetailedViewModal: React.FC<DetailedViewModalProps> = ({
  isOpen,
  onClose,
  entity,
  title,
  subtitle
}) => {
  const renderDetailedContent = () => {
    if (!entity.parsedData || !entity.parsedData.value) {
      return <p className="text-muted-foreground">No detailed data available</p>;
    }

    const data = entity.parsedData.value;

    // Handle different data types
    if (entity.parsedData.type === 'object') {
      return (
        <div className="space-y-4">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription>{subtitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Key Details */}
              {data.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {data.start_date} - {data.end_date || 'Present'}
                  </span>
                </div>
              )}
              
              {data.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{data.location}</span>
                </div>
              )}

              {data.description && (
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{data.description}</p>
                </div>
              )}

              {/* Responsibilities/Bullets */}
              {data.responsibilities && Array.isArray(data.responsibilities) && (
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Key Responsibilities</h4>
                  <ul className="space-y-1">
                    {data.responsibilities.map((item: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills/Technologies */}
              {data.skills && Array.isArray(data.skills) && (
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Skills & Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {data.achievements && Array.isArray(data.achievements) && (
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Key Achievements</h4>
                  <ul className="space-y-1">
                    {data.achievements.map((item: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Award className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-Generated Insights */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• This experience demonstrates strong {entity.field_name.includes('work') ? 'professional' : 'domain'} expertise</p>
                <p>• Relevant skills identified for modern job markets</p>
                <p>• {Math.round(entity.confidence_score * 100)}% confidence in data extraction accuracy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle arrays
    if (entity.parsedData.type === 'array' && Array.isArray(data)) {
      return (
        <div className="space-y-3">
          {data.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="text-sm">
                  {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Fallback for other types
    return (
      <Card>
        <CardContent className="pt-4">
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        
        <Separator />
        
        <div className="py-4">
          {renderDetailedContent()}
        </div>

        {/* Metadata Footer */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Source: {entity.source_type}</span>
            <span>Field: {entity.field_name}</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(entity.confidence_score * 100)}% confidence
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

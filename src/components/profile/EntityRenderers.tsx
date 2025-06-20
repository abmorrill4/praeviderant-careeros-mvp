
import React from 'react';
import { Calendar, MapPin, Building, Star } from 'lucide-react';
import type { WorkExperience, Education, Skill, Project, Certification } from '@/types/versioned-entities';

export const WorkExperienceRenderer: React.FC<{ item: WorkExperience }> = ({ item }) => (
  <div>
    <h4 className="font-medium text-sm">{item.title}</h4>
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
      <Building className="w-3 h-3" />
      <span>{item.company}</span>
      {item.start_date && (
        <>
          <Calendar className="w-3 h-3 ml-2" />
          <span>
            {item.start_date} - {item.end_date || 'Present'}
          </span>
        </>
      )}
    </div>
    {item.description && (
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
        {item.description}
      </p>
    )}
  </div>
);

export const EducationRenderer: React.FC<{ item: Education }> = ({ item }) => (
  <div>
    <h4 className="font-medium text-sm">{item.degree}</h4>
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
      <Building className="w-3 h-3" />
      <span>{item.institution}</span>
      {item.start_date && (
        <>
          <Calendar className="w-3 h-3 ml-2" />
          <span>
            {item.start_date} - {item.end_date || 'Present'}
          </span>
        </>
      )}
    </div>
    {item.field_of_study && (
      <p className="text-xs text-muted-foreground mt-1">
        Field: {item.field_of_study}
      </p>
    )}
    {item.gpa && (
      <p className="text-xs text-muted-foreground">
        GPA: {item.gpa}
      </p>
    )}
  </div>
);

export const SkillRenderer: React.FC<{ item: Skill }> = ({ item }) => (
  <div>
    <h4 className="font-medium text-sm">{item.name}</h4>
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
      {item.category && (
        <span className="bg-muted px-2 py-1 rounded">{item.category}</span>
      )}
      {item.proficiency_level && (
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>{item.proficiency_level}</span>
        </div>
      )}
      {item.years_of_experience && (
        <span>{item.years_of_experience} years</span>
      )}
    </div>
  </div>
);

export const ProjectRenderer: React.FC<{ item: Project }> = ({ item }) => (
  <div>
    <h4 className="font-medium text-sm">{item.name}</h4>
    {item.start_date && (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
        <Calendar className="w-3 h-3" />
        <span>
          {item.start_date} - {item.end_date || 'Ongoing'}
        </span>
      </div>
    )}
    {item.description && (
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
        {item.description}
      </p>
    )}
    {item.technologies_used && item.technologies_used.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {item.technologies_used.slice(0, 3).map((tech, index) => (
          <span key={index} className="bg-muted px-2 py-1 rounded text-xs">
            {tech}
          </span>
        ))}
        {item.technologies_used.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{item.technologies_used.length - 3} more
          </span>
        )}
      </div>
    )}
  </div>
);

export const CertificationRenderer: React.FC<{ item: Certification }> = ({ item }) => (
  <div>
    <h4 className="font-medium text-sm">{item.name}</h4>
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
      <Building className="w-3 h-3" />
      <span>{item.issuing_organization}</span>
      {item.issue_date && (
        <>
          <Calendar className="w-3 h-3 ml-2" />
          <span>
            Issued: {item.issue_date}
            {item.expiration_date && ` - Expires: ${item.expiration_date}`}
          </span>
        </>
      )}
    </div>
    {item.credential_id && (
      <p className="text-xs text-muted-foreground mt-1">
        ID: {item.credential_id}
      </p>
    )}
  </div>
);

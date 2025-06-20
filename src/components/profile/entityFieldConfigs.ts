
export const workExperienceFields = [
  { key: 'title', label: 'Job Title', type: 'text' as const, placeholder: 'e.g. Senior Software Engineer' },
  { key: 'company', label: 'Company', type: 'text' as const, placeholder: 'e.g. Google' },
  { key: 'start_date', label: 'Start Date', type: 'text' as const, placeholder: 'e.g. January 2020' },
  { key: 'end_date', label: 'End Date', type: 'text' as const, placeholder: 'e.g. December 2022 or leave blank if current' },
  { key: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Describe your key responsibilities and achievements...' },
];

export const educationFields = [
  { key: 'degree', label: 'Degree', type: 'text' as const, placeholder: 'e.g. Bachelor of Science' },
  { key: 'institution', label: 'Institution', type: 'text' as const, placeholder: 'e.g. Stanford University' },
  { key: 'field_of_study', label: 'Field of Study', type: 'text' as const, placeholder: 'e.g. Computer Science' },
  { key: 'start_date', label: 'Start Date', type: 'text' as const, placeholder: 'e.g. September 2016' },
  { key: 'end_date', label: 'End Date', type: 'text' as const, placeholder: 'e.g. June 2020' },
  { key: 'gpa', label: 'GPA', type: 'text' as const, placeholder: 'e.g. 3.8/4.0' },
  { key: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Additional details about your education...' },
];

export const skillFields = [
  { key: 'name', label: 'Skill Name', type: 'text' as const, placeholder: 'e.g. JavaScript' },
  { 
    key: 'category', 
    label: 'Category', 
    type: 'select' as const, 
    options: ['Programming Language', 'Framework', 'Tool', 'Soft Skill', 'Technical Skill', 'Other'],
    placeholder: 'Select a category'
  },
  { 
    key: 'proficiency_level', 
    label: 'Proficiency Level', 
    type: 'select' as const, 
    options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    placeholder: 'Select proficiency level'
  },
  { key: 'years_of_experience', label: 'Years of Experience', type: 'number' as const, placeholder: 'e.g. 3' },
];

export const projectFields = [
  { key: 'name', label: 'Project Name', type: 'text' as const, placeholder: 'e.g. E-commerce Platform' },
  { key: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Describe what the project does and your role...' },
  { key: 'technologies_used', label: 'Technologies Used', type: 'array' as const, placeholder: 'Press Enter to add each technology' },
  { key: 'start_date', label: 'Start Date', type: 'text' as const, placeholder: 'e.g. January 2023' },
  { key: 'end_date', label: 'End Date', type: 'text' as const, placeholder: 'e.g. March 2023 or leave blank if ongoing' },
  { key: 'project_url', label: 'Project URL', type: 'text' as const, placeholder: 'e.g. https://example.com' },
  { key: 'repository_url', label: 'Repository URL', type: 'text' as const, placeholder: 'e.g. https://github.com/user/repo' },
];

export const certificationFields = [
  { key: 'name', label: 'Certification Name', type: 'text' as const, placeholder: 'e.g. AWS Certified Solutions Architect' },
  { key: 'issuing_organization', label: 'Issuing Organization', type: 'text' as const, placeholder: 'e.g. Amazon Web Services' },
  { key: 'issue_date', label: 'Issue Date', type: 'text' as const, placeholder: 'e.g. June 2023' },
  { key: 'expiration_date', label: 'Expiration Date', type: 'text' as const, placeholder: 'e.g. June 2026 or leave blank if no expiration' },
  { key: 'credential_id', label: 'Credential ID', type: 'text' as const, placeholder: 'e.g. ABC123DEF456' },
  { key: 'credential_url', label: 'Credential URL', type: 'text' as const, placeholder: 'e.g. https://verify.example.com' },
];

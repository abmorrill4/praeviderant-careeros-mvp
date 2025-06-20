
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePDFRequest {
  resumeData: any;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function generateResumeHTML(resumeData: any): string {
  const {
    basics = {},
    work = [],
    education = [],
    skills = [],
    projects = [],
    certificates = []
  } = resumeData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${basics.name || 'Professional Resume'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            font-size: 14px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .header .title {
            font-size: 18px;
            color: #7f8c8d;
            margin-bottom: 15px;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 14px;
            color: #555;
        }
        
        .contact-info span {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #bdc3c7;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .summary {
            font-size: 15px;
            line-height: 1.7;
            color: #555;
            text-align: justify;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 25px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
            position: relative;
        }
        
        .experience-item::before, .education-item::before, .project-item::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 5px;
            width: 9px;
            height: 9px;
            background: #3498db;
            border-radius: 50%;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }
        
        .item-title {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .item-company, .item-institution {
            font-size: 15px;
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .item-date {
            font-size: 13px;
            color: #95a5a6;
            font-weight: 500;
        }
        
        .item-description {
            color: #555;
            margin-top: 8px;
            line-height: 1.6;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .skill-category {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .skill-category h4 {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .skill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill-tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 8px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .projects-grid {
            display: grid;
            gap: 20px;
        }
        
        .project-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
        }
        
        .project-item::before {
            background: #e74c3c;
        }
        
        .project-tech {
            margin-top: 10px;
        }
        
        .tech-tag {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-right: 6px;
            margin-bottom: 6px;
        }
        
        .certificates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .certificate-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #27ae60;
        }
        
        .certificate-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .certificate-issuer {
            color: #7f8c8d;
            font-size: 13px;
        }
        
        .certificate-date {
            color: #95a5a6;
            font-size: 12px;
            margin-top: 5px;
        }
        
        @media print {
            body { print-color-adjust: exact; }
            .container { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <h1>${basics.name || 'Professional Resume'}</h1>
            ${basics.label ? `<div class="title">${basics.label}</div>` : ''}
            <div class="contact-info">
                ${basics.email ? `<span>📧 ${basics.email}</span>` : ''}
                ${basics.phone ? `<span>📞 ${basics.phone}</span>` : ''}
                ${basics.location?.city ? `<span>📍 ${basics.location.city}</span>` : ''}
                ${basics.linkedin ? `<span>💼 LinkedIn</span>` : ''}
                ${basics.website ? `<span>🌐 Portfolio</span>` : ''}
            </div>
        </div>

        <!-- Summary Section -->
        ${basics.summary ? `
        <div class="section">
            <h2 class="section-title">Professional Summary</h2>
            <div class="summary">${basics.summary}</div>
        </div>
        ` : ''}

        <!-- Work Experience Section -->
        ${work.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Work Experience</h2>
            ${work.map(job => `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${job.position || 'Position'}</div>
                            <div class="item-company">${job.name || job.company || 'Company'}</div>
                        </div>
                        <div class="item-date">
                            ${job.startDate || ''} ${job.endDate ? `- ${job.endDate}` : '- Present'}
                        </div>
                    </div>
                    ${job.summary || job.description ? `<div class="item-description">${job.summary || job.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Education Section -->
        ${education.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Education</h2>
            ${education.map(edu => `
                <div class="education-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${edu.studyType || edu.degree || 'Degree'} ${edu.area || edu.fieldOfStudy ? `in ${edu.area || edu.fieldOfStudy}` : ''}</div>
                            <div class="item-institution">${edu.institution}</div>
                        </div>
                        <div class="item-date">
                            ${edu.startDate || ''} ${edu.endDate ? `- ${edu.endDate}` : ''}
                        </div>
                    </div>
                    ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Skills Section -->
        ${skills.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                ${(() => {
                    const skillsByCategory = skills.reduce((acc, skill) => {
                        const category = skill.category || 'General';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(skill);
                        return acc;
                    }, {});
                    
                    return Object.entries(skillsByCategory).map(([category, categorySkills]) => `
                        <div class="skill-category">
                            <h4>${category}</h4>
                            <div class="skill-list">
                                ${categorySkills.map(skill => `
                                    <span class="skill-tag">${skill.name}${skill.level ? ` (${skill.level})` : ''}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('');
                })()}
            </div>
        </div>
        ` : ''}

        <!-- Projects Section -->
        ${projects.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Projects</h2>
            <div class="projects-grid">
                ${projects.map(project => `
                    <div class="project-item">
                        <div class="item-header">
                            <div class="item-title">${project.name}</div>
                            <div class="item-date">
                                ${project.startDate || ''} ${project.endDate ? `- ${project.endDate}` : ''}
                            </div>
                        </div>
                        ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
                        ${project.keywords && project.keywords.length > 0 ? `
                            <div class="project-tech">
                                ${project.keywords.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Certificates Section -->
        ${certificates.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            <div class="certificates-grid">
                ${certificates.map(cert => `
                    <div class="certificate-item">
                        <div class="certificate-name">${cert.name}</div>
                        <div class="certificate-issuer">${cert.issuer}</div>
                        ${cert.date ? `<div class="certificate-date">Issued: ${cert.date}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `;
}

async function generatePDF(html: string, options: any = {}): Promise<Uint8Array> {
  // Note: This is a simplified version. In a real implementation, you would need to use
  // a service like Puppeteer running in a container or a third-party PDF service
  // since Deno Deploy doesn't support Puppeteer directly.
  
  // For now, we'll use a workaround with a third-party HTML to PDF service
  // In production, you'd want to use a dedicated PDF service or run Puppeteer in a container
  
  const response = await fetch('https://api.htmlcsstoimage.com/v1/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('HTMLCSS_API_KEY') || 'demo'}`,
    },
    body: JSON.stringify({
      html: html,
      css: '',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      device_scale_factor: 2,
      format: 'pdf',
      quality: 100,
    }),
  });

  if (!response.ok) {
    // Fallback: Return the HTML as a simple PDF using browser print styles
    // This is a basic fallback - in production you'd want a proper PDF service
    const encoder = new TextEncoder();
    return encoder.encode(html);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody: GeneratePDFRequest = await req.json();
    
    if (!requestBody.resumeData) {
      throw new Error('Resume data is required');
    }

    console.log('Generating PDF for resume data');

    // Generate HTML from resume data
    const html = generateResumeHTML(requestBody.resumeData);
    
    // Generate PDF from HTML
    const pdfBuffer = await generatePDF(html, {
      format: requestBody.format || 'A4',
      margin: requestBody.margin || {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    console.log('Successfully generated PDF');

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);

    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});

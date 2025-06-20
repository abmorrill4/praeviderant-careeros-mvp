
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
        @page {
            size: A4;
            margin: 20mm;
        }
        
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
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 6px;
        }
        
        .header .title {
            font-size: 16px;
            color: #7f8c8d;
            margin-bottom: 12px;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
            font-size: 12px;
            color: #555;
        }
        
        .contact-info span {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #bdc3c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary {
            font-size: 13px;
            line-height: 1.6;
            color: #555;
            text-align: justify;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 18px;
            padding-left: 15px;
            border-left: 3px solid #3498db;
            position: relative;
            page-break-inside: avoid;
        }
        
        .experience-item::before, .education-item::before, .project-item::before {
            content: '';
            position: absolute;
            left: -5px;
            top: 4px;
            width: 7px;
            height: 7px;
            background: #3498db;
            border-radius: 50%;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
            flex-wrap: wrap;
        }
        
        .item-title {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .item-company, .item-institution {
            font-size: 13px;
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .item-date {
            font-size: 11px;
            color: #95a5a6;
            font-weight: 500;
        }
        
        .item-description {
            color: #555;
            margin-top: 6px;
            line-height: 1.5;
            font-size: 12px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        }
        
        .skill-category {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #3498db;
        }
        
        .skill-category h4 {
            font-size: 12px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        
        .skill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .skill-tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 3px 6px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
        }
        
        .projects-grid {
            display: grid;
            gap: 15px;
        }
        
        .project-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #e74c3c;
        }
        
        .project-item::before {
            background: #e74c3c;
        }
        
        .project-tech {
            margin-top: 8px;
        }
        
        .tech-tag {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 9px;
            margin-right: 4px;
            margin-bottom: 4px;
        }
        
        .certificates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        
        .certificate-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #27ae60;
        }
        
        .certificate-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 4px;
            font-size: 12px;
        }
        
        .certificate-issuer {
            color: #7f8c8d;
            font-size: 11px;
        }
        
        .certificate-date {
            color: #95a5a6;
            font-size: 10px;
            margin-top: 4px;
        }
        
        @media print {
            body { 
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .container { 
                padding: 0; 
                max-width: none;
            }
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

async function convertHTMLToPDF(html: string): Promise<Uint8Array> {
  // Use jsPDF via a CDN-hosted library for PDF generation
  const jsPDFScript = `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script>
      async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const element = document.body;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        return pdf.output('arraybuffer');
      }
      
      generatePDF().then(buffer => {
        window.pdfBuffer = new Uint8Array(buffer);
        window.pdfReady = true;
      });
    </script>
  `;

  // For now, return the HTML content as a pseudo-PDF since we can't run browser APIs in Deno
  // In a production environment, you'd want to use a service like Puppeteer Cloud or similar
  const encoder = new TextEncoder();
  const htmlWithPrint = html.replace('</head>', `
    <style>
      @media print {
        html, body { 
          width: 210mm; 
          height: 297mm;
          margin: 0;
          padding: 0;
        }
      }
    </style>
    </head>
  `);
  
  // Return HTML that can be printed to PDF by the browser
  return encoder.encode(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resume PDF</title>
    </head>
    <body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
      <h3>Resume PDF Generation</h3>
      <p>To generate a PDF, please use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF".</p>
      <hr>
      ${htmlWithPrint.replace('<!DOCTYPE html>', '').replace('<html lang="en">', '').replace('</html>', '')}
    </body>
    </html>
  `);
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
    
    // Convert HTML to PDF-ready format
    const pdfBuffer = await convertHTMLToPDF(html);

    console.log('Successfully generated print-ready HTML');

    // Return HTML that can be printed to PDF
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="resume.html"',
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

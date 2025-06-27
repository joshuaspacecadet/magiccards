import React, { useRef, useState } from 'react';
import { Download, Loader2, User, Building2, Palette } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Project, Contact } from '../types';

interface DesignBriefDisplayProps {
  project: Project;
  contacts: Contact[];
}

const DesignBriefDisplay: React.FC<DesignBriefDisplayProps> = ({ project, contacts }) => {
  const briefRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    if (!briefRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // Create canvas from the brief content
      const canvas = await html2canvas(briefRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const fileName = `Design_Brief_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Compact PDF Generation Button */}
      <div className="flex justify-end">
        <button
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Design Brief Content */}
      <div ref={briefRef} className="bg-white p-8 rounded-lg border border-slate-200 space-y-8">
        {/* Contact Information - Start directly with contacts */}
        <div className="space-y-6">
          {contacts.map((contact, index) => (
            <div key={contact.id} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <div className="flex items-start space-x-4 mb-4">
                {contact.headshot && contact.headshot.length > 0 ? (
                  <img
                    src={contact.headshot[0].url}
                    alt={contact.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Contact #{index + 1}: {contact.name}
                  </h3>
                  {contact.company && (
                    <div className="flex items-center text-slate-600 mb-2">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Copy Content */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Copy Content</h4>
                  {contact.copyTitle1 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Title 1</span>
                      <p className="text-sm text-slate-900 font-medium">{contact.copyTitle1}</p>
                    </div>
                  )}
                  {contact.copyTitle2 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Title 2</span>
                      <p className="text-sm text-slate-900 font-medium">{contact.copyTitle2}</p>
                    </div>
                  )}
                  {contact.copyMainText && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Main Text</span>
                      <p className="text-sm text-slate-900 whitespace-pre-line">{contact.copyMainText}</p>
                    </div>
                  )}
                </div>

                {/* Assets Section */}
                <div className="space-y-4">
                  {/* Headshots Display */}
                  {contact.headshot && contact.headshot.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900">Headshots</h4>
                      <div className="space-y-2">
                        {contact.headshot.map((headshot, headshotIndex) => (
                          <div key={headshotIndex} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-600 truncate">{headshot.filename}</span>
                              <button
                                onClick={() => handleFileDownload(headshot.url, headshot.filename)}
                                className="text-blue-600 hover:text-blue-700 text-xs underline"
                              >
                                Download
                              </button>
                            </div>
                            <img
                              src={headshot.url}
                              alt={`${contact.name} headshot ${headshotIndex + 1}`}
                              className="max-w-full max-h-20 object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company Logo Display */}
                  {contact.companyLogo && contact.companyLogo.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900">Company Logo</h4>
                      <div className="space-y-2">
                        {contact.companyLogo.map((logo, logoIndex) => (
                          <div key={logoIndex} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-600 truncate">{logo.filename}</span>
                              <button
                                onClick={() => handleFileDownload(logo.url, logo.filename)}
                                className="text-blue-600 hover:text-blue-700 text-xs underline"
                              >
                                Download
                              </button>
                            </div>
                            <img
                              src={logo.url}
                              alt={`Company logo ${logoIndex + 1}`}
                              className="max-w-full max-h-20 object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Direction */}
              {contact.imageDirection && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-2 flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    Image Direction & Visual Notes
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-900 whitespace-pre-line">{contact.imageDirection}</p>
                  </div>
                </div>
              )}

              {/* Additional Context */}
              {contact.additionalContactContext && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-2">Additional Context</h4>
                  <p className="text-sm text-slate-600 italic">{contact.additionalContactContext}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignBriefDisplay;
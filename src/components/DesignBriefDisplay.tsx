import React, { useRef, useState } from 'react';
import { Download, Loader2, User, Building2, Palette } from 'lucide-react';
// PDF generation disabled for Stage 3 per request
import { Project, Contact } from '../types';

interface DesignBriefDisplayProps {
  project: Project;
  contacts: Contact[];
}

const DesignBriefDisplay: React.FC<DesignBriefDisplayProps> = ({ project, contacts }) => {
  const briefRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF] = useState(false);

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
      {/* PDF generation removed */}

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

              {/* Live Preview style (from Stage 2) */}
              <div className="border border-slate-700 rounded-md p-3 bg-black text-white flex flex-col gap-3" style={{ aspectRatio: '5 / 7' }}>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="border border-slate-700 rounded-md px-3 py-2 text-sm font-semibold text-white bg-black/30">
                    {contact.copyTitle1 || 'Copy Title 1'}
                  </div>
                  <div className="h-40 border border-slate-700 rounded-md overflow-auto bg-black p-3">
                    <div className="text-xs font-semibold text-white mb-1">Image Direction & Visual Notes</div>
                    <div className="text-xs text-white whitespace-pre-line">
                      {contact.imageDirection || 'No image direction provided.'}
                    </div>
                  </div>
                  <div className="border border-slate-700 rounded-md px-3 py-2 text-sm font-semibold text-white bg-black/30">
                    {contact.copyTitle2 || 'Copy Title 2'}
                  </div>
                  <div className="border border-slate-700 rounded-md px-3 py-2 bg-black/30">
                    <div className="text-xs font-semibold text-white mb-1">
                      {(contact as any).copyTitle3 || 'Copy Title 3'}
                    </div>
                    <div className="text-xs text-white whitespace-pre-line">
                      {contact.copyMainText || 'Main copy will appear here...'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <img src="/spacecadet-logo.png" alt="Spacecadet" className="h-3 opacity-80" />
                  <div className="text-[10px] text-white/60">preview</div>
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
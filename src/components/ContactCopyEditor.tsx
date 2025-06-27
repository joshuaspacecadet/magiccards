import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check, User, ExternalLink } from 'lucide-react';
import { Contact } from '../types';

interface ContactCopyEditorProps {
  contact: Contact;
  onSave: (contactId: string, copyData: Partial<Contact>) => Promise<boolean>;
  isReadOnly?: boolean;
}

const ContactCopyEditor: React.FC<ContactCopyEditorProps> = ({
  contact,
  onSave,
  isReadOnly = false
}) => {
  const [copyData, setCopyData] = useState({
    copyTitle1: contact.copyTitle1 || '',
    copyTitle2: contact.copyTitle2 || '',
    copyMainText: contact.copyMainText || '',
    imageDirection: contact.imageDirection || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setCopyData({
      copyTitle1: contact.copyTitle1 || '',
      copyTitle2: contact.copyTitle2 || '',
      copyMainText: contact.copyMainText || '',
      imageDirection: contact.imageDirection || ''
    });
    setHasChanges(false);
    setSaveStatus('idle');
  }, [contact]);

  const handleInputChange = (field: keyof typeof copyData, value: string) => {
    setCopyData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const success = await onSave(contact.id, copyData);
      if (success) {
        setSaveStatus('success');
        setHasChanges(false);
        // Clear success status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving copy:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveButtonContent = () => {
    if (isSaving) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Saving...
        </>
      );
    }
    if (saveStatus === 'success') {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          Saved!
        </>
      );
    }
    return (
      <>
        <Save className="h-4 w-4 mr-2" />
        Save Copy
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
      {/* Contact Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        {contact.headshot && contact.headshot.length > 0 ? (
          <img
            src={contact.headshot[0].url}
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{contact.name}</h4>
          {contact.company && (
            <p className="text-sm text-slate-600">{contact.company}</p>
          )}
          
          {/* LinkedIn URL */}
          {contact.linkedinUrl && (
            <div className="flex items-center mt-1">
              <ExternalLink className="h-3 w-3 mr-1 text-slate-500" />
              <a 
                href={contact.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
          
          {/* Additional Contact Context */}
          {contact.additionalContactContext && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600 italic">
                {contact.additionalContactContext}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Copy Input Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Copy Title 1
          </label>
          <input
            type="text"
            value={copyData.copyTitle1}
            onChange={(e) => handleInputChange('copyTitle1', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Enter first title line..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Copy Title 2
          </label>
          <input
            type="text"
            value={copyData.copyTitle2}
            onChange={(e) => handleInputChange('copyTitle2', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Enter second title line..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Copy Main Text
          </label>
          <textarea
            value={copyData.copyMainText}
            onChange={(e) => handleInputChange('copyMainText', e.target.value)}
            disabled={isReadOnly}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Enter main copy text..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Image Direction
          </label>
          <textarea
            value={copyData.imageDirection}
            onChange={(e) => handleInputChange('imageDirection', e.target.value)}
            disabled={isReadOnly}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Enter specific image direction and visual notes for the designer..."
          />
        </div>
      </div>

      {/* Save Button */}
      {!isReadOnly && (
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : saveStatus === 'success'
                ? 'bg-green-600 text-white'
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {getSaveButtonContent()}
          </button>
        </div>
      )}

      {/* Error Message */}
      {saveStatus === 'error' && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          Failed to save copy. Please try again.
        </div>
      )}
    </div>
  );
};

export default ContactCopyEditor;
import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Upload, Eye, Trash2 } from 'lucide-react';
import { Contact, AirtableAttachment } from '../types';
import { normalizeUrl, isValidUrl } from '../utils/urlHelpers';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  contact?: Contact;
  isLoading?: boolean;
  availableCreators: string[]; // ADD THIS LINE
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contact,
  isLoading = false,
  availableCreators // ADD THIS LINE
}) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    streetLine1: '',
    streetNumber: '',
    streetLine2: '',
    city: '',
    state: '',
    postCode: '',
    countryCode: '',
    linkedinUrl: '',
    additionalContactContext: '',
    contactAddedBy: '' // Add the new field
  });

  const [headshots, setHeadshots] = useState<AirtableAttachment[]>([]);
  const [companyLogos, setCompanyLogos] = useState<AirtableAttachment[]>([]);
  const [isUploadingHeadshots, setIsUploadingHeadshots] = useState(false);
  const [isUploadingLogos, setIsUploadingLogos] = useState(false);
  const [linkedinUrlError, setLinkedinUrlError] = useState<string>('');

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        company: contact.company || '',
        email: contact.email || '',
        phone: contact.phone || '',
        streetLine1: contact.streetLine1 || '',
        streetNumber: contact.streetNumber || '',
        streetLine2: contact.streetLine2 || '',
        city: contact.city || '',
        state: contact.state || '',
        postCode: contact.postCode || '',
        countryCode: contact.countryCode || '',
        linkedinUrl: contact.linkedinUrl || '',
        additionalContactContext: contact.additionalContactContext || '',
        contactAddedBy: contact.contactAddedBy || '' // Add the new field
      });
      setHeadshots(contact.headshot || []);
      setCompanyLogos(contact.companyLogo || []);
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        streetLine1: '',
        streetNumber: '',
        streetLine2: '',
        city: '',
        state: '',
        postCode: '',
        countryCode: '',
        linkedinUrl: '',
        additionalContactContext: '',
        contactAddedBy: '' // Add the new field
      });
      setHeadshots([]);
      setCompanyLogos([]);
    }
    setLinkedinUrlError('');
  }, [contact]);

  const handleLinkedInUrlChange = (value: string) => {
    setFormData({ ...formData, linkedinUrl: value });
    
    // Validate LinkedIn URL if provided
    if (value.trim()) {
      const normalizedUrl = normalizeUrl(value.trim());
      if (!isValidUrl(normalizedUrl)) {
        setLinkedinUrlError('Please enter a valid URL (e.g., https://linkedin.com/in/username)');
      } else if (!normalizedUrl.toLowerCase().includes('linkedin.com')) {
        setLinkedinUrlError('Please enter a LinkedIn URL');
      } else {
        setLinkedinUrlError('');
      }
    } else {
      setLinkedinUrlError('');
    }
  };

  const handleFileUpload = useCallback(async (files: File[], type: 'headshot' | 'logo') => {
    if (files.length === 0) return;

    const setUploading = type === 'headshot' ? setIsUploadingHeadshots : setIsUploadingLogos;
    const currentFiles = type === 'headshot' ? headshots : companyLogos;
    const setFiles = type === 'headshot' ? setHeadshots : setCompanyLogos;

    setUploading(true);
    try {
      // Convert files to base64 for Airtable upload
      const uploadPromises = files.map(async (file) => {
        return new Promise<AirtableAttachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            const attachment: AirtableAttachment = {
              id: `temp_${Date.now()}_${Math.random()}`,
              url: base64,
              filename: file.name,
              size: file.size,
              type: file.type
            };
            resolve(attachment);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const newAttachments = await Promise.all(uploadPromises);
      setFiles([...currentFiles, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  }, [headshots, companyLogos]);

  const handleHeadshotSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files, 'headshot');
      e.target.value = '';
    }
  }, [handleFileUpload]);

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files, 'logo');
      e.target.value = '';
    }
  }, [handleFileUpload]);

  const handleRemoveFile = (index: number, type: 'headshot' | 'logo') => {
    if (type === 'headshot') {
      setHeadshots(prev => prev.filter((_, i) => i !== index));
    } else {
      setCompanyLogos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePreviewFile = (file: AirtableAttachment) => {
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  const isImage = (file: AirtableAttachment) => {
    return file.type.startsWith('image/') || file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if there's a LinkedIn URL error
    if (linkedinUrlError) {
      return;
    }

    // Normalize the LinkedIn URL before saving
    const normalizedLinkedInUrl = formData.linkedinUrl.trim() 
      ? normalizeUrl(formData.linkedinUrl.trim()) 
      : '';

    onSave({
      ...formData,
      linkedinUrl: normalizedLinkedInUrl,
      headshot: headshots,
      companyLogo: companyLogos
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recipient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>

              {/* Add Contact Added By field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Added By
                </label>
                <select
                  value={formData.contactAddedBy}
                  onChange={(e) => setFormData({ ...formData, contactAddedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Select Creator</option>
                  {availableCreators.map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Images
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Headshot Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Headshot
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleHeadshotSelect}
                    className="hidden"
                    id="headshot-upload"
                    disabled={isUploadingHeadshots}
                  />
                  <label
                    htmlFor="headshot-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {isUploadingHeadshots ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-600">
                      {isUploadingHeadshots ? 'Uploading...' : 'Click to upload headshot'}
                    </span>
                  </label>
                </div>
                
                {/* Headshot Preview */}
                {headshots.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {headshots.map((file, index) => (
                      <div key={index} className="relative group">
                        {isImage(file) ? (
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handlePreviewFile(file)}
                          />
                        ) : (
                          <div className="w-full h-20 bg-slate-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-slate-500 text-center p-1">{file.filename}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index, 'headshot')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Company Logo Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Company Logo
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                    id="logo-upload"
                    disabled={isUploadingLogos}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {isUploadingLogos ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-600">
                      {isUploadingLogos ? 'Uploading...' : 'Click to upload logo'}
                    </span>
                  </label>
                </div>
                
                {/* Logo Preview */}
                {companyLogos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {companyLogos.map((file, index) => (
                      <div key={index} className="relative group">
                        {isImage(file) ? (
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-20 object-contain rounded border cursor-pointer hover:opacity-80 transition-opacity bg-white"
                            onClick={() => handlePreviewFile(file)}
                          />
                        ) : (
                          <div className="w-full h-20 bg-slate-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-slate-500 text-center p-1">{file.filename}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index, 'logo')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Line 1
                </label>
                <input
                  type="text"
                  value={formData.streetLine1}
                  onChange={(e) => setFormData({ ...formData, streetLine1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Number (Leave Blank)
                </label>
                <input
                  type="text"
                  value={formData.streetNumber}
                  onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Line 2 (Unit Number)
                </label>
                <input
                  type="text"
                  value={formData.streetLine2}
                  onChange={(e) => setFormData({ ...formData, streetLine2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apt, Suite, Unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State/Province"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Post Code (5 digits)
                </label>
                <input
                  type="text"
                  value={formData.postCode}
                  onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Country Code
                </label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="US, CA, UK, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleLinkedInUrlChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    linkedinUrlError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                  placeholder="https://linkedin.com/in/username"
                />
                {linkedinUrlError && (
                  <p className="mt-1 text-xs text-red-600">{linkedinUrlError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Context */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Additional Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional Contact Context
              </label>
              <textarea
                value={formData.additionalContactContext}
                onChange={(e) => setFormData({ ...formData, additionalContactContext: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes or context about this contact..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingHeadshots || isUploadingLogos || !!linkedinUrlError}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                contact ? 'Update Contact' : 'Add Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
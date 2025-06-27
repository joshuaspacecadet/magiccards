import React, { useState, useCallback } from 'react';
import { Upload, X, Eye, Save, Loader2, Check, User, FileText, Image, XCircle } from 'lucide-react';
import { Contact, AirtableAttachment } from '../types';

interface ContactDesignRoundEditorProps {
  contact: Contact;
  onSave: (contactId: string, updates: Partial<Contact>) => Promise<boolean>;
  isReadOnly?: boolean;
  roundNumber: 1 | 2 | 3;
  round?: 1 | 2 | 3; // For backward compatibility
}

const ContactDesignRoundEditor: React.FC<ContactDesignRoundEditorProps> = ({
  contact,
  onSave,
  isReadOnly = false,
  roundNumber,
  round
}) => {
  // Use round prop if provided, otherwise use roundNumber
  const currentRound = round || roundNumber;
  
  const [feedback, setFeedback] = useState(
    currentRound === 1 ? (contact.round1DraftFeedback || '') : 
    currentRound === 2 ? (contact.round2DraftFeedback || '') : ''
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRejectToggling, setIsRejectToggling] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  const currentFiles = currentRound === 1 ? (contact.round1Draft || []) : 
                      currentRound === 2 ? (contact.round2Draft || []) : 
                      (contact.round3Draft || []);
  
  const isRejected = currentRound === 1 ? contact.rejectRound1 : 
                    currentRound === 2 ? contact.rejectRound2 : false;
  
  const rejectField = currentRound === 1 ? 'rejectRound1' : 'rejectRound2';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) {
      setIsDragOver(true);
    }
  }, [isReadOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isReadOnly) return;

    const files = Array.from(e.dataTransfer.files);
    await handleFileUpload(files);
  }, [isReadOnly]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !e.target.files) return;
    
    const files = Array.from(e.target.files);
    await handleFileUpload(files);
    
    // Reset input
    e.target.value = '';
  }, [isReadOnly]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
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
      const updatedFiles = [...currentFiles, ...newAttachments];

      // Save to Airtable immediately
      const updateData = currentRound === 1 
        ? { round1Draft: updatedFiles }
        : currentRound === 2 
        ? { round2Draft: updatedFiles }
        : { round3Draft: updatedFiles };

      const success = await onSave(contact.id, updateData);
      if (!success) {
        throw new Error('Failed to upload files');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setSaveStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (fileIndex: number) => {
    if (isReadOnly) return;

    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
    const updateData = currentRound === 1 
      ? { round1Draft: updatedFiles }
      : currentRound === 2 
      ? { round2Draft: updatedFiles }
      : { round3Draft: updatedFiles };

    const success = await onSave(contact.id, updateData);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSaveFeedback = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const updateData = currentRound === 1 
        ? { round1DraftFeedback: feedback }
        : currentRound === 2 
        ? { round2DraftFeedback: feedback }
        : {};

      const success = await onSave(contact.id, updateData);
      if (success) {
        setSaveStatus('success');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleReject = async () => {
    if (isReadOnly || currentRound === 3) return;

    setIsRejectToggling(true);
    try {
      const newRejectValue = !isRejected;
      const updateData = { [rejectField]: newRejectValue };
      
      const success = await onSave(contact.id, updateData);
      if (success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error toggling reject status:', error);
      setSaveStatus('error');
    } finally {
      setIsRejectToggling(false);
    }
  };

  const handleFilePreview = (file: AirtableAttachment) => {
    window.open(file.url, '_blank');
  };

  const isImage = (file: AirtableAttachment) => {
    return file.type.startsWith('image/') || file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
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
        Save Feedback
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
      {/* Contact Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          {contact.headshot && contact.headshot.length > 0 ? (
            <img
              src={contact.headshot[0].url}
              alt={contact.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div>
            <h4 className="font-semibold text-slate-900">{contact.name}</h4>
            {contact.company && (
              <p className="text-sm text-slate-600">{contact.company}</p>
            )}
            {/* Display "Added by [Name]" if contactAddedBy has a value */}
            {contact.contactAddedBy && (
              <div className="flex items-center text-xs text-slate-500 mt-1">
                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Added by {contact.contactAddedBy}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reject Button - Only show for rounds 1 and 2, and when not read-only */}
        {!isReadOnly && currentRound !== 3 && (
          <button
            onClick={handleToggleReject}
            disabled={isRejectToggling}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isRejected
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-red-600 text-white hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRejectToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>{isRejected ? 'Rejected' : 'Reject'}</span>
          </button>
        )}

        {/* Read-only reject status */}
        {isReadOnly && isRejected && currentRound !== 3 && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      {!isReadOnly && (
        <div className="space-y-4">
          <h5 className="font-medium text-slate-900">Upload Design Round {currentRound} Files</h5>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-slate-600">Uploading files...</span>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-900 mb-2">
                  Drop design files here or click to browse
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Supports images, PDFs, and other design files
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.ai,.psd,.sketch,.fig"
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`file-upload-${contact.id}-round${currentRound}`}
                />
                <label
                  htmlFor={`file-upload-${contact.id}-round${currentRound}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Files Display */}
      {currentFiles.length > 0 && (
        <div className="space-y-4">
          <h5 className="font-medium text-slate-900">
            Design Round {currentRound} Files ({currentFiles.length})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFiles.map((file, index) => (
              <div key={index} className="relative group bg-slate-50 rounded-lg border border-slate-200 p-4">
                {isImage(file) ? (
                  <div className="aspect-square mb-3 bg-white rounded border overflow-hidden">
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleFilePreview(file)}
                    />
                  </div>
                ) : (
                  <div className="aspect-square mb-3 bg-white rounded border flex items-center justify-center">
                    <FileText className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => handleFilePreview(file)}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                  
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Section - Hide for Round 3 */}
      {currentRound !== 3 && (
        <div className="space-y-4">
          <h5 className="font-medium text-slate-900">Design Round {currentRound} Feedback</h5>
          <textarea
            value={feedback}
            onChange={(e) => handleFeedbackChange(e.target.value)}
            disabled={isReadOnly}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            placeholder={`Enter feedback for ${contact.name}'s design round ${currentRound}...`}
          />
          
          {!isReadOnly && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveFeedback}
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
        </div>
      )}

      {/* Status Messages */}
      {saveStatus === 'error' && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          Failed to save changes. Please try again.
        </div>
      )}
    </div>
  );
};

export default ContactDesignRoundEditor;
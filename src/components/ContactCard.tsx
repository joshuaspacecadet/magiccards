import React, { useState } from 'react';
import { Edit, Trash2, Mail, Phone, MapPin, ExternalLink, Copy, Check, X } from 'lucide-react';
import { Contact } from '../types';
import { normalizeUrl, openUrlSafely } from '../utils/urlHelpers';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onUpdate: (contactId: string, updates: Partial<Contact>) => void | Promise<void>;
  isStageLocked?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  onEdit, 
  onDelete, 
  onUpdate,
  isStageLocked = false 
}) => {
  const [showDetails] = useState(true);
  const [copiedConfirmUrl, setCopiedConfirmUrl] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagFeedback, setFlagFeedback] = useState("");
  const [flagError, setFlagError] = useState("");
  const [isConfirmClearFeedbackOpen, setIsConfirmClearFeedbackOpen] = useState(false);

  console.log("Debug: ContactCard received contact:", contact);

  const handleImageClick = (imageUrl: string) => {
    openUrlSafely(imageUrl);
  };

  const handleLinkedInClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (contact.linkedinUrl) {
      openUrlSafely(contact.linkedinUrl);
    }
  };

  const handleCopyConfirmUrl = async () => {
    if (!contact.confirmAddressUrl) return;
    try {
      await navigator.clipboard.writeText(contact.confirmAddressUrl);
      setCopiedConfirmUrl(true);
      setTimeout(() => setCopiedConfirmUrl(false), 1500);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const formatAddress = (contact: Contact): string => {
    const addressParts = [];
    
    if (contact.streetLine1) addressParts.push(contact.streetLine1);
    if (contact.streetNumber) addressParts.push(contact.streetNumber);
    if (contact.streetLine2) addressParts.push(contact.streetLine2);
    
    const cityStateZip = [];
    if (contact.city) cityStateZip.push(contact.city);
    if (contact.state) cityStateZip.push(contact.state);
    if (contact.postCode) cityStateZip.push(contact.postCode);
    
    if (cityStateZip.length > 0) {
      addressParts.push(cityStateZip.join(', '));
    }
    
    if (contact.countryCode) addressParts.push(contact.countryCode);
    
    return addressParts.join('\n');
  };

  // Details are always shown; no toggle

  return (
    <>
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full relative">
      {/* Absolutized action buttons to avoid layout shift/overlap */}
      {!isStageLocked && (
        <div className="absolute top-2 right-2 flex space-x-1 z-10">
          <button
            onClick={() => onEdit(contact)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit contact"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete contact"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-start mb-4 pr-10">
        <div className="flex items-start space-x-3 flex-1">
          {contact.headshot && contact.headshot.length > 0 ? (
            <img
              src={contact.headshot[0].url}
              alt={`${contact.name} headshot`}
              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setPreviewUrl(contact.headshot![0].url)}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 truncate">{contact.name}</h4>
            {contact.company && (
              <div className="flex items-center text-sm text-slate-600 mt-1">
                {contact.companyLogo && contact.companyLogo.length > 0 ? (
                  <img
                    src={contact.companyLogo[0].url}
                    alt="Company logo"
                    className="h-4 w-4 mr-1 object-contain cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={() => handleImageClick(contact.companyLogo![0].url)}
                  />
                ) : (
                  <div className="h-4 w-4 mr-1 flex items-center justify-center border border-red-600 rounded bg-red-50 text-red-600 text-[10px] leading-none flex-shrink-0">?</div>
                )}
                <span className="truncate">{contact.company}</span>
              </div>
            )}
            
            {/* Display "Added by [Name]" if contactAddedBy has a value */}
            {contact.contactAddedBy && (
              <div className="flex items-center text-xs text-slate-500 mt-1">
                <span>Added by {contact.contactAddedBy}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Missing Address Callout (visible in main view) */}
        {!contact.streetLine1 && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded flex items-center justify-between">
            <span className="text-xs font-medium text-red-700">Missing Address</span>
            {contact.confirmAddressUrl && (
              <button
                onClick={handleCopyConfirmUrl}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors flex items-center"
                title={copiedConfirmUrl ? 'Copied!' : 'Copy Confirm Address URL'}
              >
                {copiedConfirmUrl ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Items toggles */}
        <div className="mb-2 text-xs flex items-center gap-4">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!contact.magicCards}
              onChange={async () => {
                await onUpdate(contact.id, { magicCards: !contact.magicCards });
              }}
              disabled={isStageLocked}
            />
            <span>Magic Cards</span>
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!contact.sfsBook}
              onChange={async () => {
                await onUpdate(contact.id, { sfsBook: !contact.sfsBook });
              }}
              disabled={isStageLocked}
            />
            <span>SFS Book</span>
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!contact.goldenRecord}
              onChange={async () => {
                await onUpdate(contact.id, { goldenRecord: !contact.goldenRecord });
              }}
              disabled={isStageLocked}
            />
            <span>Golden Record</span>
          </label>
        </div>

        {/* Always-visible contact details */}
        <div className="mt-1 space-y-2 text-sm">
          {contact.email && (
            <div className="flex items-center text-slate-600">
              <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
              <a href={`mailto:${contact.email}`} className="hover:text-blue-600 transition-colors truncate text-xs">
                {contact.email}
              </a>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center text-slate-600">
              <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
              <a href={`tel:${contact.phone}`} className="hover:text-blue-600 transition-colors">
                {contact.phone}
              </a>
            </div>
          )}

          {formatAddress(contact) && (
            <div className="flex items-start text-slate-600">
              <MapPin className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-xs whitespace-pre-line">
                {formatAddress(contact)}
              </div>
            </div>
          )}

          {contact.linkedinUrl && (
            <div className="flex items-center text-slate-600">
              <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
              <button 
                onClick={handleLinkedInClick}
                className="hover:text-blue-600 transition-colors text-xs truncate text-left"
              >
                LinkedIn Profile
              </button>
            </div>
          )}

          {contact.confirmAddressUrl && contact.streetLine1 && (
            <div className="flex items-center text-slate-600">
              <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
              <button
                onClick={() => openUrlSafely(contact.confirmAddressUrl!)}
                className="hover:text-blue-600 transition-colors text-xs truncate text-left mr-2"
                title={contact.confirmAddressUrl}
              >
                Confirm Address URL
              </button>
              <button
                onClick={handleCopyConfirmUrl}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title={copiedConfirmUrl ? 'Copied!' : 'Copy URL'}
              >
                {copiedConfirmUrl ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          )}

          {contact.additionalContactContext && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600 italic">
                {contact.additionalContactContext}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Review Actions */}
      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-2">
        <button
          className={`px-2.5 py-1 text-xs rounded border transition-colors ${contact.contactReview === 'Approve' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}`}
          onClick={() => onUpdate(contact.id, { contactReview: 'Approve', contactReviewFeedback: '' })}
          disabled={isStageLocked}
        >
          Approve
        </button>
        <button
          className={`px-2.5 py-1 text-xs rounded border transition-colors ${contact.contactReview === 'Flag' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'}`}
          onClick={() => {
            if (isStageLocked) return;
            setFlagFeedback(contact.contactReview === 'Flag' ? (contact.contactReviewFeedback || '') : '');
            setFlagError("");
            setIsFlagModalOpen(true);
          }}
          disabled={isStageLocked}
        >
          Flag
        </button>
        <button
          className={`px-2.5 py-1 text-xs rounded border transition-colors ${contact.contactReview === 'Do Not Send' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-300 hover:bg-red-50'}`}
          onClick={() => {
            if (isStageLocked) return;
            const hasFeedback = !!(contact.contactReviewFeedback && contact.contactReviewFeedback.trim().length > 0);
            if (hasFeedback) {
              setIsConfirmClearFeedbackOpen(true);
            } else {
              onUpdate(contact.id, { contactReview: 'Do Not Send', contactReviewFeedback: '' });
            }
          }}
          disabled={isStageLocked}
        >
          Do Not Send
        </button>
      </div>

      {/* Flag Feedback Modal */}
      {isFlagModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
          onClick={() => setIsFlagModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Provide feedback</h4>
              <button
                onClick={() => setIsFlagModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3">Please share why this recipient is being flagged.</p>
            <textarea
              value={flagFeedback}
              onChange={(e) => setFlagFeedback(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              placeholder="Write feedback..."
            />
            {flagError && <div className="text-xs text-red-600 mb-2">{flagError}</div>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsFlagModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!flagFeedback.trim()) {
                    setFlagError('Feedback is required to flag a recipient.');
                    return;
                  }
                  onUpdate(contact.id, { contactReview: 'Flag', contactReviewFeedback: flagFeedback.trim() });
                  setIsFlagModalOpen(false);
                }}
                className="px-3 py-1.5 text-xs rounded bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Save Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear feedback for Do Not Send */}
      {isConfirmClearFeedbackOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
          onClick={() => setIsConfirmClearFeedbackOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Delete saved feedback?</h4>
              <button
                onClick={() => setIsConfirmClearFeedbackOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">Switching to “Do Not Send” will remove the saved feedback on this contact. Are you sure?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmClearFeedbackOpen(false)}
                className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdate(contact.id, { contactReview: 'Do Not Send', contactReviewFeedback: '' });
                  setIsConfirmClearFeedbackOpen(false);
                }}
                className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No toggle; details are always shown */}
      </div>
    </>
  );
};

export default ContactCard;
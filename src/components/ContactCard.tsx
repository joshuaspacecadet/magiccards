import React, { useState } from 'react';
import { Edit, Trash2, Mail, Phone, MapPin, ExternalLink, Copy, Check } from 'lucide-react';
import { Contact } from '../types';
import { normalizeUrl, openUrlSafely } from '../utils/urlHelpers';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  isStageLocked?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  onEdit, 
  onDelete, 
  isStageLocked = false 
}) => {
  const [showDetails] = useState(true);
  const [copiedConfirmUrl, setCopiedConfirmUrl] = useState(false);

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
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {contact.headshot && contact.headshot.length > 0 ? (
            <img
              src={contact.headshot[0].url}
              alt={`${contact.name} headshot`}
              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(contact.headshot![0].url)}
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
        
        {/* Action buttons - always visible */}
        <div className="flex space-x-1 flex-shrink-0">
          {!isStageLocked && (
            <>
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
            </>
          )}
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

      {/* No toggle; details are always shown */}
    </div>
  );
};

export default ContactCard;
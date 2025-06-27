import React, { useState } from 'react';
import { Edit, Trash2, Mail, Phone, Building2, MapPin, ExternalLink, ChevronDown, ChevronUp, User } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);

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

  const hasContactDetails = contact.email || contact.phone || formatAddress(contact);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
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
                <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{contact.company}</span>
                {contact.companyLogo && contact.companyLogo.length > 0 && (
                  <img
                    src={contact.companyLogo[0].url}
                    alt="Company logo"
                    className="ml-2 w-4 h-4 object-contain cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={() => handleImageClick(contact.companyLogo![0].url)}
                  />
                )}
              </div>
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

      {/* Toggle button for contact details */}
      {hasContactDetails && (
        <div className="border-t border-slate-200 pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Toggleable contact details */}
          {showDetails && (
            <div className="mt-3 space-y-2 text-sm">
              {contact.email && (
                <div className="flex items-center text-slate-600">
                  <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600 transition-colors truncate">
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

              {contact.additionalContactContext && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600 italic">
                    {contact.additionalContactContext}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactCard;
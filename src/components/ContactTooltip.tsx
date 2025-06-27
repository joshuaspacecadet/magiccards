import React, { useState, useEffect } from 'react';
import { Contact } from '../types';

interface ContactTooltipProps {
  contacts: Contact[];
  isVisible: boolean;
  mousePosition: { x: number; y: number };
}

const ContactTooltip: React.FC<ContactTooltipProps> = ({
  contacts,
  isVisible,
  mousePosition
}) => {
  if (!isVisible || contacts.length === 0) return null;

  return (
    <div
      className="fixed bg-white border border-slate-300 rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
      style={{
        left: mousePosition.x + 10,
        top: mousePosition.y - 10,
        zIndex: 9999,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="text-xs font-medium text-slate-700 mb-2">
        Contacts ({contacts.length})
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {contacts.map((contact, index) => (
          <div key={contact.id} className="text-sm text-slate-900">
            {contact.name}{contact.company ? `, ${contact.company}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactTooltip;
import Airtable from 'airtable';
import { airtableConfig } from '../config/airtable';
import { Project, Contact, ProjectStage, AirtableAttachment } from '../types';

// Initialize Airtable
let base: Airtable.Base | null = null;

if (airtableConfig.apiKey && airtableConfig.baseId) {
  Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: airtableConfig.apiKey
  });
  
  base = Airtable.base(airtableConfig.baseId);
}

// Helper function to transform Airtable record to Project
const transformAirtableProject = (record: any): Project => {
  const fields = record.fields;
  return {
    id: record.id,
    name: fields['Project'] || '',
    stage: fields['Stage'] || 'Contacts',
    trackingNumber: fields['Tracking Number'] || '',
    illustratorFiles: fields['Final Design File'] || [],
    finalDesignFileLink: fields['Final Design File Link'] || '', // New field mapping
    linkedContacts: fields['Contacts'] || [], // Array of Contact record IDs
    printerSubmissionDate: fields['Printer Submission Date'] || '',
    shippedToPacksmithDate: fields['Shipped to Packsmith Date'] || '',
    createdAt: fields['Created At'] || record._rawJson.createdTime,
    updatedAt: fields['Last Modified'] || record._rawJson.createdTime // Use Last Modified field
  };
};

// Helper function to transform Airtable record to Contact
const transformAirtableContact = (record: any): Contact => {
  const fields = record.fields;
  console.log("Debug: transformAirtableContact - raw record fields:", fields);
  
  const transformedContact = {
    id: record.id,
    name: fields['Recipient Name*'] || '', // FIXED: Added asterisk to match actual field name
    company: fields['Company'] || '',
    email: fields['Email'] || '',
    phone: fields['Phone'] || '',
    streetLine1: fields['Street Line 1'] || '',
    streetNumber: fields['Street Number (Leave Blank)'] || '',
    streetLine2: fields['Street Line 2 (Unit Number)'] || '',
    city: fields['City'] || '',
    state: fields['State'] || '',
    postCode: fields['Post Code (5 digits)'] || '',
    countryCode: fields['Country Code'] || '',
    companyLogo: fields['Company Logo'] || [],
    headshot: fields['Headshot'] || [],
    linkedinUrl: fields['LinkedIn URL'] || '',
    additionalContactContext: fields['Additional Contact Context'] || '',
    contactAddedBy: fields['Contact Added By'] || '', // ADD THIS LINE
    copyTitle1: fields['Copy Title 1'] || '',
    copyTitle2: fields['Copy Title 2'] || '',
    copyMainText: fields['Copy Main Text'] || '',
    imageDirection: fields['Image Direction'] || '',
    round1Draft: fields['Round 1 Draft'] || [],
    round1DraftFeedback: fields['Round 1 Draft Feedback'] || '',
    rejectRound1: fields['Reject Round 1'] || false,
    round2Draft: fields['Round 2 Draft'] || [],
    round2DraftFeedback: fields['Round 2 Draft Feedback'] || '',
    rejectRound2: fields['Reject Round 2'] || false,
    round3Draft: fields['Round 3 Draft'] || [],
    createdAt: fields['Created At'],
    updatedAt: fields['Updated At']
  };
  
  console.log("Debug: transformAirtableContact - transformed contact:", transformedContact);
  return transformedContact;
};

export class AirtableService {
  // Projects operations
  static async getProjects(): Promise<Project[]> {
    if (!base) {
      console.warn('Airtable not configured');
      return [];
    }

    try {
      const records = await base(airtableConfig.tables.projects)
        .select({
          sort: [{ field: 'Created At', direction: 'desc' }]
        })
        .all();

      return records.map(transformAirtableProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getProject(id: string): Promise<Project | null> {
    if (!base) {
      console.warn('Airtable not configured');
      return null;
    }

    try {
      const record = await base(airtableConfig.tables.projects).find(id);
      return transformAirtableProject(record);
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  static async createProject(projectData: Partial<Project>): Promise<Project | null> {
    if (!base) {
      console.warn('Airtable not configured');
      return null;
    }

    try {
      const createFields: any = {
        'Project': projectData.name,
        'Stage': projectData.stage || 'Contacts'
      };

      if (projectData.trackingNumber) createFields['Tracking Number'] = projectData.trackingNumber;
      if (projectData.finalDesignFileLink) createFields['Final Design File Link'] = projectData.finalDesignFileLink; // New field
      if (projectData.printerSubmissionDate) createFields['Printer Submission Date'] = projectData.printerSubmissionDate;
      if (projectData.shippedToPacksmithDate) createFields['Shipped to Packsmith Date'] = projectData.shippedToPacksmithDate;

      const record = await base(airtableConfig.tables.projects).create(createFields);
      return transformAirtableProject(record);
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    if (!base) {
      console.warn('Airtable not configured');
      return null;
    }

    try {
      const updateFields: any = {};
      if (updates.name !== undefined) updateFields['Project'] = updates.name;
      if (updates.stage !== undefined) updateFields['Stage'] = updates.stage;
      if (updates.trackingNumber !== undefined) updateFields['Tracking Number'] = updates.trackingNumber;
      if (updates.illustratorFiles !== undefined) updateFields['Final Design File'] = updates.illustratorFiles;
      if (updates.finalDesignFileLink !== undefined) updateFields['Final Design File Link'] = updates.finalDesignFileLink; // New field
      if (updates.linkedContacts !== undefined) updateFields['Contacts'] = updates.linkedContacts;
      if (updates.printerSubmissionDate !== undefined) updateFields['Printer Submission Date'] = updates.printerSubmissionDate;
      if (updates.shippedToPacksmithDate !== undefined) updateFields['Shipped to Packsmith Date'] = updates.shippedToPacksmithDate;

      const record = await base(airtableConfig.tables.projects).update(id, updateFields);
      return transformAirtableProject(record);
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  static async deleteProject(id: string): Promise<boolean> {
    if (!base) {
      console.warn('Airtable not configured');
      return false;
    }

    try {
      await base(airtableConfig.tables.projects).destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Contacts operations
  static async getContacts(): Promise<Contact[]> {
    if (!base) {
      console.warn('Airtable not configured');
      return [];
    }

    try {
      const records = await base(airtableConfig.tables.contacts)
        .select({
          sort: [{ field: 'Recipient Name*', direction: 'asc' }] // FIXED: Added asterisk
        })
        .all();

      return records.map(transformAirtableContact);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  // Fixed method to fetch contacts by their IDs - removed sort option
  static async getContactsByIds(contactIds: string[]): Promise<Contact[]> {
    if (!base || !contactIds || contactIds.length === 0) {
      return [];
    }

    try {
      // Build the OR formula for filtering by record IDs
      const orConditions = contactIds.map(id => `RECORD_ID() = "${id}"`).join(', ');
      const filterFormula = `OR(${orConditions})`;
      
      console.log("Debug: getContactsByIds - contactIds:", contactIds);
      console.log("Debug: getContactsByIds - filterFormula:", filterFormula);

      const records = await base(airtableConfig.tables.contacts)
        .select({
          filterByFormula: filterFormula
          // Removed sort option to fix 422 error when combined with filterByFormula
        })
        .all();

      console.log("Debug: getContactsByIds - raw records from Airtable:", records);
      const transformedContacts = records.map(transformAirtableContact);
      console.log("Debug: getContactsByIds - transformed contacts:", transformedContacts);
      
      return transformedContacts;
    } catch (error) {
      console.error('Error fetching contacts by IDs:', error);
      return [];
    }
  }

  static async createContact(contactData: Partial<Contact>): Promise<Contact | null> {
    if (!base) {
      console.warn('Airtable not configured');
      return null;
    }

    try {
      const createFields: any = {};
      if (contactData.name) createFields['Recipient Name*'] = contactData.name; // FIXED: Added asterisk
      if (contactData.company) createFields['Company'] = contactData.company;
      if (contactData.email) createFields['Email'] = contactData.email;
      if (contactData.phone) createFields['Phone'] = contactData.phone;
      if (contactData.streetLine1) createFields['Street Line 1'] = contactData.streetLine1;
      if (contactData.streetNumber) createFields['Street Number (Leave Blank)'] = contactData.streetNumber;
      if (contactData.streetLine2) createFields['Street Line 2 (Unit Number)'] = contactData.streetLine2;
      if (contactData.city) createFields['City'] = contactData.city;
      if (contactData.state) createFields['State'] = contactData.state;
      if (contactData.postCode) createFields['Post Code (5 digits)'] = contactData.postCode;
      if (contactData.countryCode) createFields['Country Code'] = contactData.countryCode;
      if (contactData.linkedinUrl) createFields['LinkedIn URL'] = contactData.linkedinUrl;
      if (contactData.additionalContactContext) createFields['Additional Contact Context'] = contactData.additionalContactContext;
      if (contactData.contactAddedBy) createFields['Contact Added By'] = contactData.contactAddedBy; // ADD THIS LINE
      if (contactData.copyTitle1) createFields['Copy Title 1'] = contactData.copyTitle1;
      if (contactData.copyTitle2) createFields['Copy Title 2'] = contactData.copyTitle2;
      if (contactData.copyMainText) createFields['Copy Main Text'] = contactData.copyMainText;
      if (contactData.imageDirection) createFields['Image Direction'] = contactData.imageDirection;
      if (contactData.round1DraftFeedback) createFields['Round 1 Draft Feedback'] = contactData.round1DraftFeedback;
      if (contactData.round2DraftFeedback) createFields['Round 2 Draft Feedback'] = contactData.round2DraftFeedback;
      if (contactData.headshot) createFields['Headshot'] = contactData.headshot;
      if (contactData.companyLogo) createFields['Company Logo'] = contactData.companyLogo;
      if (contactData.rejectRound1 !== undefined) createFields['Reject Round 1'] = contactData.rejectRound1;
      if (contactData.rejectRound2 !== undefined) createFields['Reject Round 2'] = contactData.rejectRound2;

      const record = await base(airtableConfig.tables.contacts).create(createFields);
      return transformAirtableContact(record);
    } catch (error) {
      console.error('Error creating contact:', error);
      return null;
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    if (!base) {
      console.warn('Airtable not configured');
      return null;
    }

    try {
      const updateFields: any = {};
      if (updates.name) updateFields['Recipient Name*'] = updates.name; // FIXED: Added asterisk
      if (updates.company !== undefined) updateFields['Company'] = updates.company;
      if (updates.email !== undefined) updateFields['Email'] = updates.email;
      if (updates.phone !== undefined) updateFields['Phone'] = updates.phone;
      if (updates.streetLine1 !== undefined) updateFields['Street Line 1'] = updates.streetLine1;
      if (updates.streetNumber !== undefined) updateFields['Street Number (Leave Blank)'] = updates.streetNumber;
      if (updates.streetLine2 !== undefined) updateFields['Street Line 2 (Unit Number)'] = updates.streetLine2;
      if (updates.city !== undefined) updateFields['City'] = updates.city;
      if (updates.state !== undefined) updateFields['State'] = updates.state;
      if (updates.postCode !== undefined) updateFields['Post Code (5 digits)'] = updates.postCode;
      if (updates.countryCode !== undefined) updateFields['Country Code'] = updates.countryCode;
      if (updates.linkedinUrl !== undefined) updateFields['LinkedIn URL'] = updates.linkedinUrl;
      if (updates.additionalContactContext !== undefined) updateFields['Additional Contact Context'] = updates.additionalContactContext;
      if (updates.contactAddedBy !== undefined) updateFields['Contact Added By'] = updates.contactAddedBy; // ADD THIS LINE
      if (updates.copyTitle1 !== undefined) updateFields['Copy Title 1'] = updates.copyTitle1;
      if (updates.copyTitle2 !== undefined) updateFields['Copy Title 2'] = updates.copyTitle2;
      if (updates.copyMainText !== undefined) updateFields['Copy Main Text'] = updates.copyMainText;
      if (updates.imageDirection !== undefined) updateFields['Image Direction'] = updates.imageDirection;
      if (updates.round1Draft !== undefined) updateFields['Round 1 Draft'] = updates.round1Draft;
      if (updates.round1DraftFeedback !== undefined) updateFields['Round 1 Draft Feedback'] = updates.round1DraftFeedback;
      if (updates.rejectRound1 !== undefined) updateFields['Reject Round 1'] = updates.rejectRound1;
      if (updates.round2Draft !== undefined) updateFields['Round 2 Draft'] = updates.round2Draft;
      if (updates.round2DraftFeedback !== undefined) updateFields['Round 2 Draft Feedback'] = updates.round2DraftFeedback;
      if (updates.rejectRound2 !== undefined) updateFields['Reject Round 2'] = updates.rejectRound2;
      if (updates.round3Draft !== undefined) updateFields['Round 3 Draft'] = updates.round3Draft;
      if (updates.headshot !== undefined) updateFields['Headshot'] = updates.headshot;
      if (updates.companyLogo !== undefined) updateFields['Company Logo'] = updates.companyLogo;

      const record = await base(airtableConfig.tables.contacts).update(id, updateFields);
      return transformAirtableContact(record);
    } catch (error) {
      console.error('Error updating contact:', error);
      return null;
    }
  }

  static async deleteContact(id: string): Promise<boolean> {
    if (!base) {
      console.warn('Airtable not configured');
      return false;
    }

    try {
      await base(airtableConfig.tables.contacts).destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  }

  // Helper method to link a contact to a project
  static async linkContactToProject(projectId: string, contactId: string): Promise<boolean> {
    if (!base) {
      console.warn('Airtable not configured');
      return false;
    }

    try {
      // First, get the current project to see existing linked contacts
      const project = await this.getProject(projectId);
      if (!project) return false;

      // Add the new contact ID to the existing linked contacts
      const updatedLinkedContacts = [...(project.linkedContacts || []), contactId];
      
      // Update the project with the new linked contacts
      const updatedProject = await this.updateProject(projectId, { 
        linkedContacts: updatedLinkedContacts 
      });
      
      return !!updatedProject;
    } catch (error) {
      console.error('Error linking contact to project:', error);
      return false;
    }
  }

  // Helper method to unlink a contact from a project
  static async unlinkContactFromProject(projectId: string, contactId: string): Promise<boolean> {
    if (!base) {
      console.warn('Airtable not configured');
      return false;
    }

    try {
      // First, get the current project to see existing linked contacts
      const project = await this.getProject(projectId);
      if (!project) return false;

      // Remove the contact ID from the existing linked contacts
      const updatedLinkedContacts = (project.linkedContacts || []).filter(id => id !== contactId);
      
      // Update the project with the updated linked contacts
      const updatedProject = await this.updateProject(projectId, { 
        linkedContacts: updatedLinkedContacts 
      });
      
      return !!updatedProject;
    } catch (error) {
      console.error('Error unlinking contact from project:', error);
      return false;
    }
  }
}
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.warn('Airtable configuration missing. Please set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID environment variables.');
}

export const airtableConfig = {
  apiKey: AIRTABLE_API_KEY,
  baseId: AIRTABLE_BASE_ID,
  tables: {
    projects: 'Projects',
    contacts: 'Contacts'
  }
};

export const PREDEFINED_CONTACT_CREATORS: string[] = [
  'Wiz',   // REPLACE WITH YOUR ACTUAL CREATOR NAMES FROM AIRTABLE
  'Daniel', // REPLACE WITH YOUR ACTUAL CREATOR NAMES FROM AIRTABLE
  'John',   // REPLACE WITH YOUR ACTUAL CREATOR NAMES FROM AIRTABLE
  // Add all other actual names from your Airtable "Contact Added By" field here
].sort(); // This sorts the names alphabetically
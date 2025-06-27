# Custom Card Production Tracker

A beautiful, production-ready web application for managing custom card production projects with Airtable integration.

## Features

- **Admin Dashboard**: Complete project management with create, read, update, delete operations
- **Project Funnel Views**: Dynamic, status-driven project tracking for collaborators
- **Airtable Integration**: Seamless connection to your existing Projects and Contacts tables
- **Real-time Status Updates**: Automatic progression through project stages
- **File Management**: Support for project attachments and illustrator files
- **Responsive Design**: Beautiful interface that works on all devices

## Setup Instructions

### 1. Airtable Configuration

1. **Get your Airtable API Key**:
   - Go to [Airtable Tokens](https://airtable.com/create/tokens)
   - Create a new personal access token
   - Give it appropriate permissions for your bases

2. **Get your Base ID**:
   - Open your Airtable base
   - The Base ID is in the URL: `https://airtable.com/[BASE_ID]/...`

3. **Set up your tables**:
   - **Projects Table** should have these fields:
     - `Name` (Single line text)
     - `Status` (Single select with options: planning, design_brief, illustration, review, production, shipping, completed, on_hold)
     - `Description` (Long text)
     - `Client` (Single line text)
     - `Deadline` (Date)
     - `Attachments` (Attachment)
     - `Created At` (Created time)
     - `Updated At` (Last modified time)
   
   - **Contacts Table** should have these fields:
     - `Name` (Single line text)
     - `Email` (Email)
     - `Role` (Single line text)
     - `Company` (Single line text)
     - `Phone` (Phone number)

### 2. Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Airtable credentials:
   ```
   VITE_AIRTABLE_API_KEY=your_api_key_here
   VITE_AIRTABLE_BASE_ID=your_base_id_here
   ```

### 3. Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application:
   - Admin dashboard: `http://localhost:5173/admin`
   - Project funnel: `http://localhost:5173/project/[PROJECT_ID]`

## Usage

### Admin Dashboard
- View all projects in a beautiful card layout
- Create new projects with the "New Project" button
- Edit existing projects by clicking "Edit"
- Delete projects with confirmation
- Open project funnels by clicking "Open Funnel"
- Search and filter projects

### Project Funnel Views
- Each project has a unique URL that can be shared with collaborators
- Dynamic content based on project status
- Interactive stages that advance the project automatically
- No login required for collaborator access
- Beautiful, professional interface for client interaction

## Project Status Flow

Projects automatically progress through these stages:
1. **Planning** → Design Brief
2. **Design Brief** → Illustration  
3. **Illustration** → Review
4. **Review** → Production
5. **Production** → Shipping
6. **Shipping** → Completed

Each stage can be advanced by clicking the "Mark as Complete" button in the funnel view.

## Customization

The application is built with a modular architecture that makes it easy to:
- Add new project statuses
- Customize funnel stage content
- Modify the color scheme and styling
- Add new fields to projects
- Integrate additional Airtable tables

## Architecture

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **State Management**: React hooks
- **Backend**: Airtable API integration
- **Icons**: Lucide React
- **Build Tool**: Vite

## Contributing

This application is designed to be production-ready and easily extensible. Feel free to customize it for your specific workflow needs.
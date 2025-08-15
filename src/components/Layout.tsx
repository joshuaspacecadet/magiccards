import React from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { Palette, Users, Settings } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { PROJECT_STAGE_CARD_LABELS } from '../types';

const Layout: React.FC = () => {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const isAdminPage = location.pathname === '/admin';
  const isProjectPage = location.pathname.startsWith('/project/');
  
  // Get project data if we're on a project page
  const { project } = useProject(projectId);

  const getProjectTitle = () => {
    if (isProjectPage && project) {
      return `${project.name} Print & Fulfill Order`;
    }
    return 'Magic Cards Project Dashboard';
  };

  const getSubtitle = () => {
    if (isProjectPage && project) {
      return PROJECT_STAGE_CARD_LABELS[project.stage];
    }
    return 'Spacecadet';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              
              <div>
                <h1 className="text-xl font-bold text-slate-900">{getProjectTitle()}</h1>
                <p className="text-sm text-slate-500">{getSubtitle()}</p>
              </div>
            </div>
            
  
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
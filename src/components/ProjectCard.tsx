import React from 'react';
import { ExternalLink, Hash, FileText, Users } from 'lucide-react';
import { Project } from '../types';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onOpenFunnel: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onOpenFunnel
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {project.name}
            </h3>
            <StatusBadge status={project.stage} />
          </div>
          <button
            onClick={() => onOpenFunnel(project.id)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            title="Open Project Funnel"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open Funnel</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-4">
            {project.trackingNumber && (
              <div className="flex items-center space-x-1">
                <Hash className="h-4 w-4" />
                <span>{project.trackingNumber}</span>
              </div>
            )}
            {project.linkedContacts && project.linkedContacts.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{project.linkedContacts.length} contact{project.linkedContacts.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {project.illustratorFiles && project.illustratorFiles.length > 0 && (
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{project.illustratorFiles.length} file(s)</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => onEdit(project)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
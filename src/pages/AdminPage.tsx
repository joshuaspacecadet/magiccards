import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, Loader2, ExternalLink, Hash, Users, Calendar, Filter, Package, Truck, Clock, FileText } from 'lucide-react';
import { Project, ProjectStage, PROJECT_STAGE_LABELS, PROJECT_STAGE_CARD_LABELS, Contact } from '../types';
import { AirtableService } from '../services/airtable';
import StatusBadge from '../components/StatusBadge';
import ProjectModal from '../components/ProjectModal';
import ContactTooltip from '../components/ContactTooltip';

const AdminPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<ProjectStage | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Contact tooltip state
  const [hoveredProjectContacts, setHoveredProjectContacts] = useState<Contact[]>([]);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.trackingNumber && project.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (stageFilter !== 'all') {
      filtered = filtered.filter(project => project.stage === stageFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, stageFilter]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await AirtableService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    setIsSaving(true);
    try {
      if (editingProject) {
        const updatedProject = await AirtableService.updateProject(editingProject.id, projectData);
        if (updatedProject) {
          setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
        }
      } else {
        const newProject = await AirtableService.createProject(projectData);
        if (newProject) {
          setProjects(prev => [newProject, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const success = await AirtableService.deleteProject(id);
        if (success) {
          setProjects(prev => prev.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleOpenFunnel = (id: string) => {
    window.open(`/project/${id}`, '_blank');
  };

  const handleTrackingClick = (trackingNumber: string) => {
    const trackingUrl = `https://t.17track.net/en#nums=${trackingNumber}`;
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleContactsHover = async (e: React.MouseEvent, project: Project) => {
    if (!project.linkedContacts || project.linkedContacts.length === 0) return;

    // Update mouse position
    setMousePosition({ x: e.clientX, y: e.clientY });

    try {
      // Load contacts for this project
      const contacts = await AirtableService.getContactsByIds(project.linkedContacts);
      setHoveredProjectContacts(contacts);
      setIsTooltipVisible(true);
    } catch (error) {
      console.error('Error loading contacts for tooltip:', error);
    }
  };

  const handleContactsMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleContactsLeave = () => {
    setIsTooltipVisible(false);
    setHoveredProjectContacts([]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter(p => !['Project Complete'].includes(p.stage)).length;
    const completed = projects.filter(p => p.stage === 'Project Complete').length;
    return { total, active, completed };
  };

  const stats = getProjectStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
          <div className="text-xl font-bold text-blue-600 mb-1">{stats.total}</div>
          <div className="text-xs text-slate-600">Total Projects</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
          <div className="text-xl font-bold text-orange-600 mb-1">{stats.active}</div>
          <div className="text-xs text-slate-600">Active Projects</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
          <div className="text-xl font-bold text-green-600 mb-1">{stats.completed}</div>
          <div className="text-xs text-slate-600">Completed</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Stage Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as ProjectStage | 'all')}
                className="pl-10 pr-8 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[180px] text-sm"
              >
                <option value="all">All Stages</option>
                {Object.entries(PROJECT_STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateProject}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-lg p-8 border border-slate-200 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm || stageFilter !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || stageFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first project to get started'
              }
            </p>
            {!searchTerm && stageFilter === 'all' && (
              <button
                onClick={handleCreateProject}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create First Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {project.name}
                      </h3>
                      <StatusBadge status={project.stage} useCardLabels={false} className="text-xs" />
                    </div>
                    
                    {/* Optimized Project Details Grid - Better spacing for longer labels */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 text-xs">
                      {/* Tracking Number */}
                      {project.trackingNumber && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                          <div className="flex items-center space-x-1 mb-2">
                            <Hash className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">Tracking</span>
                          </div>
                          <button
                            onClick={() => handleTrackingClick(project.trackingNumber!)}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors text-xs truncate text-left mt-auto"
                            title="Track package on 17track.net"
                          >
                            {project.trackingNumber}
                          </button>
                        </div>
                      )}

                      {/* Contacts Count with Hover */}
                      {project.linkedContacts && project.linkedContacts.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                          <div className="flex items-center space-x-1 mb-2">
                            <Users className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">Contacts</span>
                          </div>
                          <span 
                            className="text-slate-900 font-semibold cursor-pointer hover:text-blue-600 transition-colors text-xs mt-auto"
                            onMouseEnter={(e) => handleContactsHover(e, project)}
                            onMouseMove={handleContactsMouseMove}
                            onMouseLeave={handleContactsLeave}
                          >
                            {project.linkedContacts.length}
                          </span>
                        </div>
                      )}

                      {/* Files Count */}
                      {project.illustratorFiles && project.illustratorFiles.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                          <div className="flex items-center space-x-1 mb-2">
                            <FileText className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">Files</span>
                          </div>
                          <span className="text-slate-900 font-semibold text-xs mt-auto">
                            {project.illustratorFiles.length}
                          </span>
                        </div>
                      )}

                      {/* Project Started Date */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                        <div className="flex items-center space-x-1 mb-2">
                          <Calendar className="h-3 w-3 text-slate-500 flex-shrink-0" />
                          <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">Started</span>
                        </div>
                        <span className="text-slate-900 font-semibold text-xs mt-auto">
                          {formatDate(project.createdAt)}
                        </span>
                      </div>

                      {/* Printer Submission Date - Optimized for longer label */}
                      {project.printerSubmissionDate && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                          <div className="flex items-center space-x-1 mb-2">
                            <Package className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">
                              Printer<br />Shipped
                            </span>
                          </div>
                          <span className="text-slate-900 font-semibold text-xs mt-auto">
                            {formatDate(project.printerSubmissionDate)}
                          </span>
                        </div>
                      )}

                      {/* Shipped to Packsmith Date - Optimized for longer label */}
                      {project.shippedToPacksmithDate && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                          <div className="flex items-center space-x-1 mb-2">
                            <Truck className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">
                              Packsmith<br />Received
                            </span>
                          </div>
                          <span className="text-slate-900 font-semibold text-xs mt-auto">
                            {formatDate(project.shippedToPacksmithDate)}
                          </span>
                        </div>
                      )}

                      {/* Last Updated with Time - Always show */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] flex flex-col">
                        <div className="flex items-center space-x-1 mb-2">
                          <Clock className="h-3 w-3 text-slate-500 flex-shrink-0" />
                          <span className="text-slate-600 font-medium text-xs uppercase tracking-wide leading-tight">Updated</span>
                        </div>
                        <span className="text-slate-900 font-semibold text-xs mt-auto" title={formatDateTime(project.updatedAt) || ''}>
                          {formatDate(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleOpenFunnel(project.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Tooltip */}
      <ContactTooltip
        contacts={hoveredProjectContacts}
        isVisible={isTooltipVisible}
        mousePosition={mousePosition}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
        isLoading={isSaving}
      />
    </div>
  );
};

export default AdminPage;
import { useState, useEffect } from 'react';
import { Project } from '../types';
import { AirtableService } from '../services/airtable';

export const useProject = (projectId?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    const loadProject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const projectData = await AirtableService.getProject(projectId);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  return { project, isLoading, error };
};
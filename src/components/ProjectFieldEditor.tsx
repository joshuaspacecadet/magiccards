import React, { useState } from 'react';
import { Save, Loader2, Check, X } from 'lucide-react';

interface ProjectFieldEditorProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<boolean>;
  type?: 'text' | 'date';
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const ProjectFieldEditor: React.FC<ProjectFieldEditorProps> = ({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
  icon,
  disabled = false
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    setCurrentValue(value);
    setHasChanges(false);
    setSaveStatus('idle');
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setCurrentValue(newValue);
    setHasChanges(newValue !== value);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const success = await onSave(currentValue);
      if (success) {
        setSaveStatus('success');
        setHasChanges(false);
        // Clear success status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving field:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasChanges && !isSaving) {
      handleSave();
    }
  };

  const getSaveButtonContent = () => {
    if (isSaving) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (saveStatus === 'success') {
      return <Check className="h-4 w-4" />;
    }
    if (saveStatus === 'error') {
      return <X className="h-4 w-4" />;
    }
    return <Save className="h-4 w-4" />;
  };

  const getButtonColor = () => {
    if (isSaving || !hasChanges) {
      return 'bg-slate-200 text-slate-500 cursor-not-allowed';
    }
    if (saveStatus === 'success') {
      return 'bg-green-600 text-white';
    }
    if (saveStatus === 'error') {
      return 'bg-red-600 text-white hover:bg-red-700';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {icon && <span className="inline-flex items-center mr-1">{icon}</span>}
        {label}
      </label>
      
      <div className="flex items-center space-x-2">
        <input
          type={type}
          value={currentValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || isSaving}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
          placeholder={placeholder}
        />
        
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || disabled}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center min-w-[80px] ${getButtonColor()}`}
          title={
            isSaving ? 'Saving...' :
            saveStatus === 'success' ? 'Saved!' :
            saveStatus === 'error' ? 'Error - Click to retry' :
            hasChanges ? 'Save changes' : 'No changes'
          }
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              <span className="text-xs">Saving</span>
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              <span className="text-xs">Saved!</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <X className="h-4 w-4 mr-1" />
              <span className="text-xs">Error</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              <span className="text-xs">Save</span>
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {saveStatus === 'error' && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
          Failed to save. Please try again.
        </div>
      )}
      
      {hasChanges && saveStatus === 'idle' && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
          You have unsaved changes. Click Save or press Enter to save.
        </div>
      )}
    </div>
  );
};

export default ProjectFieldEditor;
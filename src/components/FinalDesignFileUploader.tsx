import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Eye,
  Save,
  Loader2,
  Check,
  FileText,
  Image,
  Download,
  AlertCircle,
  Link,
  ExternalLink,
} from "lucide-react";
import { Project, AirtableAttachment } from "../types";
import { AirtableService } from "../services/airtable";
import { normalizeUrl, isValidUrl, openUrlSafely } from "../utils/urlHelpers";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

interface FinalDesignFileUploaderProps {
  project: Project;
  onSave: (
    projectId: string,
    files: { url: string; filename: string }[]
  ) => Promise<boolean>;
  isReadOnly?: boolean;
}

const FinalDesignFileUploader: React.FC<FinalDesignFileUploaderProps> = ({
  project,
  onSave,
  isReadOnly = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showLinkHint, setShowLinkHint] = useState<boolean>(false);

  // URL field state
  const [designFileUrl, setDesignFileUrl] = useState(
    project.finalDesignFileLink || ""
  );
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const urlSectionRef = useRef<HTMLDivElement | null>(null);
  const [isUrlSaving, setIsUrlSaving] = useState(false);
  const [urlSaveStatus, setUrlSaveStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [hasUrlChanges, setHasUrlChanges] = useState(false);
  const [urlError, setUrlError] = useState<string>("");

  const currentFiles = project.illustratorFiles || [];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isReadOnly) {
        setIsDragOver(true);
      }
    },
    [isReadOnly]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (isReadOnly) return;

      const files = Array.from(e.dataTransfer.files);
      await handleFileUpload(files);
    },
    [isReadOnly]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isReadOnly || !e.target.files) return;

      const files = Array.from(e.target.files);
      await handleFileUpload(files);

      // Reset input
      e.target.value = "";
    },
    [isReadOnly]
  );

  const validateFile = (file: File): string | null => {
    // Check file size (100MB)
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 100MB.`;
    }

    // Check file type
    const allowedExtensions = [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
      ".ai",
      ".psd",
      ".sketch",
      ".fig",
      ".eps",
      ".indd",
      ".tiff",
      ".tif",
    ];

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidType = allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      return `File "${file.name}" is not a supported format. Please use AI, PSD, PDF, or image files.`;
    }

    return null;
  };

  const processFileForAirtable = async (
    file: File
  ): Promise<{ url: string; filename: string }> => {
    const url = await uploadToCloudinary(file);
    return { url, filename: file.name };
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setSaveStatus("idle");
    setErrorMessage("");
    setUploadProgress({});

    try {
      // Validate all files first
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Process files one by one to avoid memory issues
      const processedFiles: { url: string; filename: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        // Initialize progress
        setUploadProgress((prev) => ({ ...prev, [fileName]: 0 }));
        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => ({
              ...prev,
              [fileName]: Math.min((prev[fileName] || 0) + 15, 85),
            }));
          }, 300);
          // Upload to Cloudinary and get the URL
          const processedFile = await processFileForAirtable(file);
          clearInterval(progressInterval);
          setUploadProgress((prev) => ({ ...prev, [fileName]: 95 }));
          processedFiles.push(processedFile);
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
          throw new Error(
            `Failed to process ${fileName}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
      // Update progress to show saving
      Object.keys(uploadProgress).forEach((fileName) => {
        setUploadProgress((prev) => ({ ...prev, [fileName]: 98 }));
      });
      // Combine with existing files and save to Airtable
      const updatedFiles = [...currentFiles, ...processedFiles];
      const success = await onSave(project.id, updatedFiles);
      if (!success) {
        throw new Error(
          "Failed to attach files to Airtable. Please paste a link instead for non-image files."
        );
      }
      // Complete progress
      Object.keys(uploadProgress).forEach((fileName) => {
        setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }));
      });
      setSaveStatus("success");
      // Clear progress after success
      setTimeout(() => {
        setUploadProgress({});
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error uploading files:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to upload files";
      setErrorMessage(errorMsg);
      const isMaxSize = /file size too large|maximum is/i.test(errorMsg);
      const hasNonImage = files.some((f) => !(f.type || "").startsWith("image/"));
      setShowLinkHint(isMaxSize || hasNonImage);
      setSaveStatus("error");
      setUploadProgress({});
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (showLinkHint) {
      // Auto-scroll to URL section and focus the input to prompt using a link
      urlSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 400);
    }
  }, [showLinkHint]);

  const handleRemoveFile = async (fileIndex: number) => {
    if (isReadOnly) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const updatedFiles = currentFiles.filter(
        (_, index) => index !== fileIndex
      );
      const success = await onSave(project.id, updatedFiles);

      if (success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
        setErrorMessage("Failed to remove file");
      }
    } catch (error) {
      console.error("Error removing file:", error);
      setSaveStatus("error");
      setErrorMessage("Failed to remove file");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilePreview = (file: AirtableAttachment) => {
    openUrlSafely(file.url);
  };

  const handleFileDownload = (file: AirtableAttachment) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // URL field handlers
  const handleUrlChange = (value: string) => {
    setDesignFileUrl(value);
    setHasUrlChanges(value !== (project.finalDesignFileLink || ""));
    setUrlSaveStatus("idle");

    // Validate URL if provided
    if (value.trim()) {
      const normalizedUrl = normalizeUrl(value.trim());
      if (!isValidUrl(normalizedUrl)) {
        setUrlError(
          "Please enter a valid URL (e.g., https://drive.google.com/...)"
        );
      } else {
        setUrlError("");
      }
    } else {
      setUrlError("");
    }
  };

  const handleUrlSave = async () => {
    if (!hasUrlChanges || isUrlSaving || urlError) return;

    setIsUrlSaving(true);
    setUrlSaveStatus("idle");

    try {
      const normalizedUrl = designFileUrl.trim()
        ? normalizeUrl(designFileUrl.trim())
        : "";
      const success = await AirtableService.updateProject(project.id, {
        finalDesignFileLink: normalizedUrl,
      });

      if (success) {
        setUrlSaveStatus("success");
        setHasUrlChanges(false);
        setTimeout(() => setUrlSaveStatus("idle"), 2000);
      } else {
        setUrlSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving URL:", error);
      setUrlSaveStatus("error");
    } finally {
      setIsUrlSaving(false);
    }
  };

  const isImage = (file: AirtableAttachment) => {
    return (
      file.type?.startsWith("image/") ||
      file.filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    );
  };

  const getFileIcon = (file: AirtableAttachment) => {
    if (isImage(file)) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-slate-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getUrlSaveButtonContent = () => {
    if (isUrlSaving) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Saving...
        </>
      );
    }
    if (urlSaveStatus === "success") {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          Saved!
        </>
      );
    }
    return (
      <>
        <Save className="h-4 w-4 mr-2" />
        Save URL
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Upload disabled: use link section below */}

      {/* URL Field Section */}
      <div ref={urlSectionRef} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2">
          <Link className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-slate-900">
            Final Design File Link
          </h4>
        </div>

        {showLinkHint && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            This file exceeds the current upload limit. Paste a link to the final design (Google Drive, Dropbox, etc.) instead.
          </div>
        )}

        <p className="text-sm text-slate-600">
          Add a link to the final design file(s) (Google Drive, Dropbox, etc.)
        </p>

        <div className="flex items-center space-x-3">
          <input
            type="url"
            value={designFileUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={isReadOnly || isUrlSaving}
            ref={urlInputRef}
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 ${
              urlError
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
            placeholder="https://drive.google.com/... or https://dropbox.com/..."
          />

          {!isReadOnly && (
            <button
              onClick={handleUrlSave}
              disabled={!hasUrlChanges || isUrlSaving || !!urlError}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                hasUrlChanges && !isUrlSaving && !urlError
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : urlSaveStatus === "success"
                  ? "bg-green-600 text-white"
                  : urlSaveStatus === "error"
                  ? "bg-red-600 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              {getUrlSaveButtonContent()}
            </button>
          )}
        </div>

        {/* URL Error */}
        {urlError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {urlError}
          </div>
        )}

        {/* Display saved URL */}
        {project.finalDesignFileLink && !hasUrlChanges && (
          <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
            <Check className="h-4 w-4" />
            <span>Link saved:</span>
            <button
              onClick={() => openUrlSafely(project.finalDesignFileLink!)}
              className="text-blue-600 hover:text-blue-700 underline flex items-center space-x-1"
            >
              <span className="truncate max-w-xs">
                {project.finalDesignFileLink}
              </span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </button>
          </div>
        )}

        {urlSaveStatus === "error" && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            Failed to save URL. Please try again.
          </div>
        )}
      </div>

      {/* Status Messages disabled with upload */}
    </div>
  );
};

export default FinalDesignFileUploader;

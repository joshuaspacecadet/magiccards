import React, { useState, useCallback } from "react";
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
  onSave: (projectId: string, files: { url: string }[]) => Promise<boolean>;
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

  // URL field state
  const [designFileUrl, setDesignFileUrl] = useState(
    project.finalDesignFileLink || ""
  );
  const [isUrlSaving, setIsUrlSaving] = useState(false);
  const [urlSaveStatus, setUrlSaveStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [hasUrlChanges, setHasUrlChanges] = useState(false);
  const [urlError, setUrlError] = useState<string>("");

  const currentFiles = project.illustratorFiles || [];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit (reduced from 100MB)

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
    // Check file size (reduced to 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 5MB.`;
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
  ): Promise<{ url: string }> => {
    const url = await uploadToCloudinary(file);
    return { url };
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
      const processedFiles: { url: string }[] = [];
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
          "Failed to save files to database. Please check your file formats and try again."
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
      setSaveStatus("error");
      setUploadProgress({});
    } finally {
      setIsUploading(false);
    }
  };

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
      {/* File Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-6">
        <div className="flex items-center space-x-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-slate-900">
            Upload Final Design Files
          </h4>
        </div>

        <p className="text-sm text-slate-600">
          Upload the final design files that are ready for production (AI, PSD,
          PDF, or image files).
        </p>

        {/* File Upload Area */}
        {!isReadOnly && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-slate-600">Uploading files...</span>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-900 mb-2">
                  Drop design files here or click to browse
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Supports AI, PSD, PDF, and image files (max 5MB each)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.ai,.psd,.sketch,.fig,.eps,.indd,.tiff,.tif"
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`final-file-upload-${project.id}`}
                />
                <label
                  htmlFor={`final-file-upload-${project.id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </label>
              </>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-slate-700">
              Upload Progress
            </h5>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="truncate">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-start space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Uploaded Files Display */}
        {currentFiles.length > 0 && (
          <div className="space-y-4">
            <h5 className="font-medium text-slate-900">
              Uploaded Files ({currentFiles.length})
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group bg-slate-50 rounded-lg border border-slate-200 p-4"
                >
                  {isImage(file) ? (
                    <div className="aspect-square mb-3 bg-white rounded border overflow-hidden">
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleFilePreview(file)}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square mb-3 bg-white rounded border flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p
                      className="text-sm font-medium text-slate-900 truncate"
                      title={file.filename}
                    >
                      {file.filename}
                    </p>
                    {file.size && (
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => handleFilePreview(file)}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleFileDownload(file)}
                      className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>

                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 transition-colors"
                        disabled={isSaving}
                      >
                        <X className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* URL Field Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2">
          <Link className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-slate-900">
            Final Design File Link
          </h4>
        </div>

        <p className="text-sm text-slate-600">
          Add a link to the final design file(s) (Google Drive, Dropbox, etc.)
        </p>

        <div className="flex items-center space-x-3">
          <input
            type="url"
            value={designFileUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={isReadOnly || isUrlSaving}
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

      {/* Status Messages */}
      {saveStatus === "success" && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
          Files uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default FinalDesignFileUploader;

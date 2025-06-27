import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, Upload, Trash2, AlertCircle } from "lucide-react";
import { Contact } from "../types";
import { normalizeUrl, isValidUrl } from "../utils/urlHelpers";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { AirtableService } from "../services/airtable";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => Promise<Contact | null>;
  contact?: Contact;
  isLoading?: boolean;
  availableCreators: string[];
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contact,
  isLoading = false,
  availableCreators,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    streetLine1: "",
    streetNumber: "",
    streetLine2: "",
    city: "",
    state: "",
    postCode: "",
    countryCode: "",
    linkedinUrl: "",
    additionalContactContext: "",
    contactAddedBy: "",
  });

  const [headshots, setHeadshots] = useState<
    { url: string; filename: string; type: string; size: number }[]
  >([]);
  const [companyLogos, setCompanyLogos] = useState<
    { url: string; filename: string; type: string; size: number }[]
  >([]);
  const [isUploadingHeadshots, setIsUploadingHeadshots] = useState(false);
  const [isUploadingLogos, setIsUploadingLogos] = useState(false);
  const [linkedinUrlError, setLinkedinUrlError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string>("");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        company: contact.company || "",
        email: contact.email || "",
        phone: contact.phone || "",
        streetLine1: contact.streetLine1 || "",
        streetNumber: contact.streetNumber || "",
        streetLine2: contact.streetLine2 || "",
        city: contact.city || "",
        state: contact.state || "",
        postCode: contact.postCode || "",
        countryCode: contact.countryCode || "",
        linkedinUrl: contact.linkedinUrl || "",
        additionalContactContext: contact.additionalContactContext || "",
        contactAddedBy: contact.contactAddedBy || "",
      });
      setHeadshots(contact.headshot || []);
      setCompanyLogos(contact.companyLogo || []);
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        streetLine1: "",
        streetNumber: "",
        streetLine2: "",
        city: "",
        state: "",
        postCode: "",
        countryCode: "",
        linkedinUrl: "",
        additionalContactContext: "",
        contactAddedBy: "",
      });
      setHeadshots([]);
      setCompanyLogos([]);
    }
    setLinkedinUrlError("");
  }, [contact]);

  const handleLinkedInUrlChange = (value: string) => {
    setFormData({ ...formData, linkedinUrl: value });

    // Validate LinkedIn URL if provided
    if (value.trim()) {
      const normalizedUrl = normalizeUrl(value.trim());
      if (!isValidUrl(normalizedUrl)) {
        setLinkedinUrlError(
          "Please enter a valid URL (e.g., https://linkedin.com/in/username)"
        );
      } else if (!normalizedUrl.toLowerCase().includes("linkedin.com")) {
        setLinkedinUrlError("Please enter a LinkedIn URL");
      } else {
        setLinkedinUrlError("");
      }
    } else {
      setLinkedinUrlError("");
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 5MB.`;
    }

    // Check file type
    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
    ];

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidType = allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      return `File "${file.name}" is not a supported format. Please use image files.`;
    }

    return null;
  };

  const processFileForAirtable = async (
    file: File
  ): Promise<{ url: string; filename: string; type: string; size: number }> => {
    const url = await uploadToCloudinary(file);
    return {
      url,
      filename: file.name,
      type: file.type,
      size: file.size,
    };
  };

  const handleFileUpload = useCallback(
    async (files: File[], type: "headshot" | "logo") => {
      console.log("handleFileUpload called", { files, type });
      if (files.length === 0) return;

      const setUploading =
        type === "headshot" ? setIsUploadingHeadshots : setIsUploadingLogos;
      const currentFiles = type === "headshot" ? headshots : companyLogos;
      const setFiles = type === "headshot" ? setHeadshots : setCompanyLogos;

      setUploading(true);
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

        console.log("Files validated successfully, starting upload...");

        // Process files one by one to avoid memory issues
        const processedFiles: {
          url: string;
          filename: string;
          type: string;
          size: number;
        }[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = file.name;

          console.log(`Processing file ${i + 1}/${files.length}: ${fileName}`);

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
            console.log(`Uploading ${fileName} to Cloudinary...`);
            const processedFile = await processFileForAirtable(file);
            console.log(`Successfully uploaded ${fileName}:`, processedFile);

            clearInterval(progressInterval);
            setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }));
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

        console.log("All files processed, updating state...");
        setFiles([...currentFiles, ...processedFiles]);

        // Clear progress after success
        setTimeout(() => {
          setUploadProgress({});
        }, 2000);
      } catch (error) {
        console.error("Error uploading files:", error);
        const errorMsg =
          error instanceof Error ? error.message : "Failed to upload files";
        setErrorMessage(errorMsg);
        setUploadProgress({});
      } finally {
        setUploading(false);
      }
    },
    [headshots, companyLogos]
  );

  const handleHeadshotSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("handleHeadshotSelect called", e.target.files);
      if (e.target.files) {
        const files = Array.from(e.target.files);
        console.log("Selected headshot files:", files);
        handleFileUpload(files, "headshot");
        e.target.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleLogoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("handleLogoSelect called", e.target.files);
      if (e.target.files) {
        const files = Array.from(e.target.files);
        console.log("Selected logo files:", files);
        handleFileUpload(files, "logo");
        e.target.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleRemoveFile = (index: number, type: "headshot" | "logo") => {
    if (type === "headshot") {
      setHeadshots((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCompanyLogos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePreviewFile = (file: {
    url: string;
    filename: string;
    type: string;
    size: number;
  }) => {
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if there's a LinkedIn URL error
    if (linkedinUrlError) {
      return;
    }

    // Normalize the LinkedIn URL before saving
    const normalizedLinkedInUrl = formData.linkedinUrl.trim()
      ? normalizeUrl(formData.linkedinUrl.trim())
      : "";

    // Create contact data without file attachments first
    const contactDataWithoutFiles = {
      ...formData,
      linkedinUrl: normalizedLinkedInUrl,
    };

    // Save contact first, then handle file uploads separately
    const savedContact = await onSave(contactDataWithoutFiles);

    // If contact was saved successfully and we have files, update it with the files
    if (savedContact && (headshots.length > 0 || companyLogos.length > 0)) {
      try {
        // Convert our simplified file format to AirtableAttachment format (url + filename only)
        const airtableHeadshots = headshots.map((file) => ({
          url: file.url,
          filename: file.filename,
        }));

        const airtableCompanyLogos = companyLogos.map((file) => ({
          url: file.url,
          filename: file.filename,
        }));

        // Update the contact with file attachments
        await AirtableService.updateContact(savedContact.id, {
          headshot: airtableHeadshots,
          companyLogo: airtableCompanyLogos,
        });
      } catch (error) {
        console.error("Error updating contact with files:", error);
        // Don't throw here - the contact was created successfully, just the files failed
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        console.log("Modal backdrop clicked", e.target);
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => {
          console.log("Modal content clicked", e.target);
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">
            {contact ? "Edit Contact" : "Add New Contact"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recipient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>

              {/* Add Contact Added By field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Added By
                </label>
                <select
                  value={formData.contactAddedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, contactAddedBy: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Select Creator</option>
                  {availableCreators.map((creator) => (
                    <option key={creator} value={creator}>
                      {creator}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Images
            </h3>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Headshot Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Headshot
                </label>

                {/* Debug button */}
                <button
                  type="button"
                  onClick={() => {
                    console.log("Debug: Clicking headshot file input");
                    document.getElementById("headshot-upload")?.click();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 mb-2"
                >
                  Debug: Click to test file input
                </button>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleHeadshotSelect}
                    className="hidden"
                    id="headshot-upload"
                    disabled={isUploadingHeadshots}
                    onClick={() => console.log("Headshot file input clicked")}
                  />
                  <label
                    htmlFor="headshot-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                    onClick={() => console.log("Headshot upload label clicked")}
                  >
                    {isUploadingHeadshots ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-600">
                      {isUploadingHeadshots
                        ? "Uploading..."
                        : "Click to upload headshot"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Max 5MB per file
                    </span>
                  </label>
                </div>

                {/* Headshot Preview */}
                {headshots.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-slate-700">
                      Headshots ({headshots.length})
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {headshots.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handlePreviewFile(file)}
                          />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(index, "headshot")
                              }
                              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <p
                            className="text-xs text-slate-600 truncate mt-1"
                            title={file.filename}
                          >
                            {file.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Company Logo Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Company Logo
                </label>

                {/* Debug button */}
                <button
                  type="button"
                  onClick={() => {
                    console.log("Debug: Clicking logo file input");
                    document.getElementById("logo-upload")?.click();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 mb-2"
                >
                  Debug: Click to test file input
                </button>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                    id="logo-upload"
                    disabled={isUploadingLogos}
                    onClick={() => console.log("Logo file input clicked")}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                    onClick={() => console.log("Logo upload label clicked")}
                  >
                    {isUploadingLogos ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-600">
                      {isUploadingLogos
                        ? "Uploading..."
                        : "Click to upload company logo"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Max 5MB per file
                    </span>
                  </label>
                </div>

                {/* Company Logo Preview */}
                {companyLogos.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-slate-700">
                      Company Logos ({companyLogos.length})
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {companyLogos.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handlePreviewFile(file)}
                          />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index, "logo")}
                              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <p
                            className="text-xs text-slate-600 truncate mt-1"
                            title={file.filename}
                          >
                            {file.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Line 1
                </label>
                <input
                  type="text"
                  value={formData.streetLine1}
                  onChange={(e) =>
                    setFormData({ ...formData, streetLine1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Number (Leave Blank)
                </label>
                <input
                  type="text"
                  value={formData.streetNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, streetNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Line 2 (Unit Number)
                </label>
                <input
                  type="text"
                  value={formData.streetLine2}
                  onChange={(e) =>
                    setFormData({ ...formData, streetLine2: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apt, Suite, Unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State/Province"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Post Code (5 digits)
                </label>
                <input
                  type="text"
                  value={formData.postCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Country Code
                </label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) =>
                    setFormData({ ...formData, countryCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="US, CA, UK, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleLinkedInUrlChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    linkedinUrlError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                  placeholder="https://linkedin.com/in/username"
                />
                {linkedinUrlError && (
                  <p className="mt-1 text-xs text-red-600">
                    {linkedinUrlError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Context */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900 border-b border-slate-200 pb-2">
              Additional Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional Contact Context
              </label>
              <textarea
                value={formData.additionalContactContext}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalContactContext: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes or context about this contact..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                isUploadingHeadshots ||
                isUploadingLogos ||
                !!linkedinUrlError
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : contact ? (
                "Update Contact"
              ) : (
                "Add Contact"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;

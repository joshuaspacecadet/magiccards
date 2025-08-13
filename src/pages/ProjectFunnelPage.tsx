import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText,
  Palette,
  Filter,
  Hash,
  ExternalLink,
} from "lucide-react";
import { Project, ProjectStage, Contact } from "../types";
import { AirtableService } from "../services/airtable";
import { PREDEFINED_CONTACT_CREATORS } from "../config/airtable";
import FunnelStage from "../components/FunnelStage";
import ContactCard from "../components/ContactCard";
import ContactModal from "../components/ContactModal";
import ContactCopyEditor from "../components/ContactCopyEditor";
import ContactDesignRoundEditor from "../components/ContactDesignRoundEditor";
import DesignBriefDisplay from "../components/DesignBriefDisplay";
import FinalDesignFileUploader from "../components/FinalDesignFileUploader";
import ProjectFieldEditor from "../components/ProjectFieldEditor";

const ProjectFunnelPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Project and contacts state
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Filter state for contacts
  const [selectedFilterCreator, setSelectedFilterCreator] =
    useState<string>("");
  const [selectedDesignCreatorFilter, setSelectedDesignCreatorFilter] =
    useState<string>("");

  // Refs for scrolling to stages
  const contactsStageRef = useRef<HTMLDivElement>(null);
  const copyStageRef = useRef<HTMLDivElement>(null);
  const designBriefStageRef = useRef<HTMLDivElement>(null);
  const designRound1StageRef = useRef<HTMLDivElement>(null);
  const designRound2StageRef = useRef<HTMLDivElement>(null);
  const handoffStageRef = useRef<HTMLDivElement>(null);
  const readyForPrintStageRef = useRef<HTMLDivElement>(null);
  const projectCompleteStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [projectData] = await Promise.all([
        AirtableService.getProject(projectId),
      ]);

      if (!projectData) {
        setError("Project not found");
        return;
      }

      setProject(projectData);

      // Filter contacts to only those linked to this project
      if (projectData.linkedContacts && projectData.linkedContacts.length > 0) {
        const linkedContacts = await AirtableService.getContactsByIds(
          projectData.linkedContacts
        );
        setContacts(linkedContacts);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      setError("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceStage = async () => {
    if (!project) return;

    const stageOrder: ProjectStage[] = [
      "Contacts",
      "Copy",
      "Design Brief",
      "Design Round 1",
      "Design Round 2",
      "Handoff",
      "Ready for Print",
      "Project Complete",
    ];

    const currentIndex = stageOrder.indexOf(project.stage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];

      try {
        const updatedProject = await AirtableService.updateProject(project.id, {
          stage: nextStage,
        });
        if (updatedProject) {
          setProject(updatedProject);

          // Scroll to the new active stage after a short delay
          setTimeout(() => {
            scrollToStage(nextStage);
          }, 300);
        }
      } catch (error) {
        console.error("Error advancing stage:", error);
      }
    }
  };

  // Deprecated: kept for reference; revert is now handled contextually via getRevertTopActions

  const handleRevertToStage = async (targetStage: ProjectStage) => {
    if (!project) return;
    try {
      const updatedProject = await AirtableService.updateProject(project.id, {
        stage: targetStage,
      });
      if (updatedProject) {
        setProject(updatedProject);
        setTimeout(() => {
          scrollToStage(targetStage);
        }, 300);
      }
    } catch (error) {
      console.error("Error reverting stage:", error);
    }
  };

  const getRevertTopActions = (stage: ProjectStage): React.ReactNode => {
    if (!project) return null;
    const stageOrder: ProjectStage[] = [
      "Contacts",
      "Copy",
      "Design Brief",
      "Design Round 1",
      "Design Round 2",
      "Handoff",
      "Ready for Print",
      "Project Complete",
    ];
    const currentIndex = stageOrder.indexOf(project.stage);
    if (currentIndex <= 0) return null;
    const previousStage = stageOrder[currentIndex - 1];
    if (previousStage !== stage) return null;
    const stageNumber = stageOrder.indexOf(stage) + 1;
    const label = `Revert to Stage ${stageNumber}`;
    return (
      <button
        onClick={() => handleRevertToStage(stage)}
        className="px-2 py-1 text-xs rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      >
        {label}
      </button>
    );
  };

  const scrollToStage = (stage: ProjectStage) => {
    const stageRefs = {
      Contacts: contactsStageRef,
      Copy: copyStageRef,
      "Design Brief": designBriefStageRef,
      "Design Round 1": designRound1StageRef,
      "Design Round 2": designRound2StageRef,
      Handoff: handoffStageRef,
      "Ready for Print": readyForPrintStageRef,
      "Project Complete": projectCompleteStageRef,
    };

    const targetRef = stageRefs[stage];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  const shouldRenderStage = (stage: ProjectStage): boolean => {
    if (!project) return false;

    const stageOrder: ProjectStage[] = [
      "Contacts",
      "Copy",
      "Design Brief",
      "Design Round 1",
      "Design Round 2",
      "Handoff",
      "Ready for Print",
      "Project Complete",
    ];

    const currentIndex = stageOrder.indexOf(project.stage);
    const stageIndex = stageOrder.indexOf(stage);

    return stageIndex <= currentIndex;
  };

  const isStageActive = (stage: ProjectStage): boolean => {
    return project?.stage === stage;
  };

  const isStageCompleted = (stage: ProjectStage): boolean => {
    if (!project) return false;

    const stageOrder: ProjectStage[] = [
      "Contacts",
      "Copy",
      "Design Brief",
      "Design Round 1",
      "Design Round 2",
      "Handoff",
      "Ready for Print",
      "Project Complete",
    ];

    const currentIndex = stageOrder.indexOf(project.stage);
    const stageIndex = stageOrder.indexOf(stage);

    return stageIndex < currentIndex;
  };

  const handleCreateContact = () => {
    setEditingContact(undefined);
    setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactModalOpen(true);
  };

  const handleSaveContact = async (
    contactData: Partial<Contact>
  ): Promise<Contact | null> => {
    if (!project) return null;

    console.log("handleSaveContact called with:", {
      contactData,
      editingContact,
    });

    setIsSavingContact(true);
    try {
      let savedContact: Contact | null = null;

      if (editingContact) {
        // Update existing contact
        console.log("Updating existing contact:", editingContact.id);
        savedContact = await AirtableService.updateContact(
          editingContact.id,
          contactData
        );
        if (savedContact) {
          console.log("Contact updated successfully:", savedContact);
          setContacts((prev) => {
            const updated = prev.map((c) =>
              c.id === editingContact.id ? savedContact! : c
            );
            console.log("[DEBUG] Updated contacts after edit:", updated);
            return updated;
          });
          setEditingContact(savedContact);
        }
      } else {
        // Create new contact
        console.log("Creating new contact");
        savedContact = await AirtableService.createContact(contactData);
        if (savedContact) {
          // Link the new contact to the project
          const linkSuccess = await AirtableService.linkContactToProject(
            project.id,
            savedContact.id
          );
          if (linkSuccess) {
            setContacts((prev) => {
              const updated = [...prev, savedContact!];
              console.log("[DEBUG] Updated contacts after create:", updated);
              return updated;
            });
            // Update project's linkedContacts in local state
            setProject((prev) =>
              prev
                ? {
                    ...prev,
                    linkedContacts: [
                      ...(prev.linkedContacts || []),
                      savedContact!.id,
                    ],
                  }
                : null
            );
            setEditingContact(savedContact);
          }
        }
      }

      if (savedContact) {
        // Reload contacts from backend to ensure up-to-date view
        if (project?.linkedContacts && project.linkedContacts.length > 0) {
          const linkedContacts = await AirtableService.getContactsByIds(
            project.linkedContacts
          );
          setContacts(linkedContacts);
        }
        setIsContactModalOpen(false);
        setEditingContact(undefined); // Clear the editing contact
      }

      return savedContact;
    } catch (error) {
      console.error("Error saving contact:", error);
      return null;
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (
      !project ||
      !window.confirm("Are you sure you want to delete this contact?")
    )
      return;

    try {
      // First unlink from project
      const unlinkSuccess = await AirtableService.unlinkContactFromProject(
        project.id,
        contactId
      );
      if (unlinkSuccess) {
        // Then delete the contact
        const deleteSuccess = await AirtableService.deleteContact(contactId);
        if (deleteSuccess) {
          setContacts((prev) => prev.filter((c) => c.id !== contactId));
          // Update project's linkedContacts in local state
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  linkedContacts: (prev.linkedContacts || []).filter(
                    (id) => id !== contactId
                  ),
                }
              : null
          );
        }
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  const handleSaveContactCopy = async (
    contactId: string,
    copyData: Partial<Contact>
  ): Promise<boolean> => {
    try {
      const updatedContact = await AirtableService.updateContact(
        contactId,
        copyData
      );
      if (updatedContact) {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? updatedContact : c))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving contact copy:", error);
      return false;
    }
  };

  const handleSaveContactDesignRound = async (
    contactId: string,
    updates: Partial<Contact>
  ): Promise<boolean> => {
    try {
      const updatedContact = await AirtableService.updateContact(
        contactId,
        updates
      );
      if (updatedContact) {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? updatedContact : c))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving contact design round:", error);
      return false;
    }
  };

  const handleSaveProjectField = async (
    field: keyof Project,
    value: string
  ): Promise<boolean> => {
    if (!project) return false;

    try {
      const updates = { [field]: value };
      const updatedProject = await AirtableService.updateProject(
        project.id,
        updates
      );
      if (updatedProject) {
        setProject(updatedProject);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving project field:", error);
      return false;
    }
  };

  const handleSaveFinalDesignFiles = async (
    projectId: string,
    files: { url: string; filename: string }[]
  ): Promise<boolean> => {
    try {
      // Convert the file format to match AirtableAttachment (url + filename only)
      const airtableFiles: { url: string; filename: string }[] = files.map(
        (file) => ({
          url: file.url,
          filename: file.filename,
        })
      );

      const updatedProject = await AirtableService.updateProject(projectId, {
        illustratorFiles:
          airtableFiles as unknown as import("../types").AirtableAttachment[],
      });
      if (updatedProject) {
        setProject(updatedProject);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving final design files:", error);
      return false;
    }
  };

  // Filter contacts based on selected creator
  const getFilteredContacts = (
    filterCreator: string = selectedFilterCreator
  ) => {
    if (!filterCreator) return contacts;
    return contacts.filter(
      (contact) => contact.contactAddedBy === filterCreator
    );
  };

  // Filter contacts for design rounds
  const getFilteredDesignContacts = (
    filterCreator: string = selectedDesignCreatorFilter
  ) => {
    if (!filterCreator) return contacts;
    return contacts.filter(
      (contact) => contact.contactAddedBy === filterCreator
    );
  };

  // CSV generation for Stage 7
  const contactsCsvDataUri = useMemo(() => {
    const headers = [
      "Full Name",
      "Street Line 1",
      "Street Line 2 (Apt, Suite, Floor, etc.)",
      "City",
      "State / Province",
      "Postal Code",
      "Country",
    ];
    const escapeCsv = (value: string | undefined) => {
      const str = (value ?? "").toString();
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const rows = contacts.map((c) => [
      escapeCsv(c.name),
      escapeCsv(c.streetLine1),
      escapeCsv(c.streetLine2),
      escapeCsv(c.city),
      escapeCsv(c.state),
      escapeCsv(c.postCode),
      escapeCsv(c.countryCode),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\r\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [contacts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <div className="bg-white rounded-xl p-8 border border-slate-200 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {error || "Project not found"}
          </h3>
          <p className="text-slate-600 mb-6">
            The project you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate("/admin")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stage 1: Contacts */}
      {shouldRenderStage("Contacts") && (
        <FunnelStage
          ref={contactsStageRef}
          title="Stage 1 — Add & Review Contacts"
          description="Add and manage the contacts who will receive a custom Magic Card."
          isActive={isStageActive("Contacts")}
          isCompleted={isStageCompleted("Contacts")}
          topActions={getRevertTopActions("Contacts")}
        >
          <div className="space-y-6">
            {/* Contact Management Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                {PREDEFINED_CONTACT_CREATORS.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-slate-500" />
                      <label
                        htmlFor="contact-filter"
                        className="text-sm font-medium text-slate-700"
                      >
                        Review contacts as:
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      {PREDEFINED_CONTACT_CREATORS.map((creator) => {
                        const isSelected = selectedFilterCreator === creator;
                        return (
                          <button
                            key={creator}
                            type="button"
                            onClick={() =>
                              setSelectedFilterCreator(
                                isSelected ? "" : creator
                              )
                            }
                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                            }`}
                            title={`Review contacts as ${creator}`}
                          >
                            {creator}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleCreateContact}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isStageCompleted("Contacts")}
              >
                <Plus className="h-4 w-4" />
                <span>Create Recipient</span>
              </button>
            </div>

            {/* Contacts Grid */}
            {getFilteredContacts().length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {selectedFilterCreator
                    ? "No contacts found for this creator"
                    : "No contacts added yet"}
                </h3>
                <p className="text-slate-600 mb-6">
                  {selectedFilterCreator
                    ? "Try selecting a different creator or clear the filter to see all contacts."
                    : "Add your first contact to get started with this project."}
                </p>
                {!selectedFilterCreator && (
                  <button
                    onClick={handleCreateContact}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add First Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredContacts().map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={handleEditContact}
                    onDelete={handleDeleteContact}
                    isStageLocked={isStageCompleted("Contacts")}
                  />
                ))}
              </div>
            )}

            {/* Stage Completion */}
            {isStageActive("Contacts") && contacts.length > 0 && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Contacts Stage</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 2: Copy */}
      {shouldRenderStage("Copy") && (
        <FunnelStage
          ref={copyStageRef}
          title="Stage 2 — Add & Review Copy"
          description="Create and review the copy content for each contact's Magic Card."
          isActive={isStageActive("Copy")}
          isCompleted={isStageCompleted("Copy")}
          topActions={getRevertTopActions("Copy")}
        >
          <div className="space-y-6">
            {contacts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No contacts available
                </h3>
                <p className="text-slate-600">
                  Add contacts in Stage 1 before proceeding with copy creation.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {contacts.map((contact) => (
                  <ContactCopyEditor
                    key={contact.id}
                    contact={contact}
                    onSave={handleSaveContactCopy}
                    isReadOnly={isStageCompleted("Copy")}
                  />
                ))}
              </div>
            )}

            {/* Stage Completion */}
            {isStageActive("Copy") && contacts.length > 0 && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Copy Stage</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 3: Design Brief */}
      {shouldRenderStage("Design Brief") && (
        <FunnelStage
          ref={designBriefStageRef}
          title="Stage 3 — Project Design Brief"
          description="Review the design brief that will guide the creation of each contact's Magic Card."
          isActive={isStageActive("Design Brief")}
          isCompleted={isStageCompleted("Design Brief")}
          topActions={getRevertTopActions("Design Brief")}
        >
          <div className="space-y-6">
            {contacts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Palette className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No contacts available
                </h3>
                <p className="text-slate-600">
                  Add contacts and copy content before generating the design
                  brief.
                </p>
              </div>
            ) : (
              <DesignBriefDisplay project={project} contacts={contacts} />
            )}

            {/* Stage Completion */}
            {isStageActive("Design Brief") && contacts.length > 0 && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Design Brief Stage</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 4: Design Round 1 */}
      {shouldRenderStage("Design Round 1") && (
        <FunnelStage
          ref={designRound1StageRef}
          title="Stage 4 — Review & Approve Designs (Round I)"
          description="Upload and review the first round of design concepts for each contact."
          isActive={isStageActive("Design Round 1")}
          isCompleted={isStageCompleted("Design Round 1")}
          topActions={getRevertTopActions("Design Round 1")}
        >
          <div className="space-y-6">
            {/* Design Creator Filter */}
            {PREDEFINED_CONTACT_CREATORS.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <label
                    htmlFor="design-creator-filter"
                    className="text-sm font-medium text-slate-700"
                  >
                    Review designs as:
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {PREDEFINED_CONTACT_CREATORS.map((creator) => {
                    const isSelected = selectedDesignCreatorFilter === creator;
                    return (
                      <button
                        key={creator}
                        type="button"
                        onClick={() =>
                          setSelectedDesignCreatorFilter(
                            isSelected ? "" : creator
                          )
                        }
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                        title={`Review designs as ${creator}`}
                      >
                        {creator}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {getFilteredDesignContacts().length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Palette className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {selectedDesignCreatorFilter
                    ? "No contacts found for this creator"
                    : "No contacts available"}
                </h3>
                <p className="text-slate-600">
                  {selectedDesignCreatorFilter
                    ? "Try selecting a different creator or clear the filter to see all contacts."
                    : "Complete previous stages to proceed with design reviews."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {getFilteredDesignContacts().map((contact) => (
                  <ContactDesignRoundEditor
                    key={contact.id}
                    contact={contact}
                    onSave={handleSaveContactDesignRound}
                    isReadOnly={isStageCompleted("Design Round 1")}
                    roundNumber={1}
                  />
                ))}
              </div>
            )}

            {/* Stage Completion */}
            {isStageActive("Design Round 1") && contacts.length > 0 && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Design Round 1</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 5: Design Round 2 */}
      {shouldRenderStage("Design Round 2") && (
        <FunnelStage
          ref={designRound2StageRef}
          title="Stage 5 — Review & Approve Designs (Round II)"
          description="Upload and review the second round of design revisions for each contact."
          isActive={isStageActive("Design Round 2")}
          isCompleted={isStageCompleted("Design Round 2")}
          topActions={getRevertTopActions("Design Round 2")}
        >
          <div className="space-y-6">
            {/* Design Creator Filter */}
            {PREDEFINED_CONTACT_CREATORS.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <label
                    htmlFor="design-creator-filter-round2"
                    className="text-sm font-medium text-slate-700"
                  >
                    Review designs as:
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {PREDEFINED_CONTACT_CREATORS.map((creator) => {
                    const isSelected = selectedDesignCreatorFilter === creator;
                    return (
                      <button
                        key={creator}
                        type="button"
                        onClick={() =>
                          setSelectedDesignCreatorFilter(
                            isSelected ? "" : creator
                          )
                        }
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                        title={`Review designs as ${creator}`}
                      >
                        {creator}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {getFilteredDesignContacts().length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Palette className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {selectedDesignCreatorFilter
                    ? "No contacts found for this creator"
                    : "No contacts available"}
                </h3>
                <p className="text-slate-600">
                  {selectedDesignCreatorFilter
                    ? "Try selecting a different creator or clear the filter to see all contacts."
                    : "Complete previous stages to proceed with design reviews."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {getFilteredDesignContacts().map((contact) => (
                  <ContactDesignRoundEditor
                    key={contact.id}
                    contact={contact}
                    onSave={handleSaveContactDesignRound}
                    isReadOnly={isStageCompleted("Design Round 2")}
                    roundNumber={2}
                  />
                ))}
              </div>
            )}

            {/* Stage Completion */}
            {isStageActive("Design Round 2") && contacts.length > 0 && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Design Round 2</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 6: Handoff */}
      {shouldRenderStage("Handoff") && (
        <FunnelStage
          ref={handoffStageRef}
          title="Stage 6 — Upload Final Design File(s)"
          description="Upload the final design files that are ready for production."
          isActive={isStageActive("Handoff")}
          isCompleted={isStageCompleted("Handoff")}
          topActions={getRevertTopActions("Handoff")}
        >
          <div className="space-y-6">
            <FinalDesignFileUploader
              project={project}
              onSave={handleSaveFinalDesignFiles}
              isReadOnly={isStageCompleted("Handoff")}
            />

            {/* Stage Completion */}
            {isStageActive("Handoff") && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Handoff Stage</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 7: Ready for Print */}
      {shouldRenderStage("Ready for Print") && (
        <FunnelStage
          ref={readyForPrintStageRef}
          title="Stage 7 — Ready for Print"
          description="Review and finalize all files and details before sending to print."
          isActive={isStageActive("Ready for Print")}
          isCompleted={isStageCompleted("Ready for Print")}
          topActions={getRevertTopActions("Ready for Print")}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProjectFieldEditor
                label="Printer Submission Date"
                value={project.printerSubmissionDate || ""}
                onSave={(value) =>
                  handleSaveProjectField("printerSubmissionDate", value)
                }
                type="date"
                placeholder="Select submission date"
                icon={<Hash className="h-4 w-4" />}
                disabled={isStageCompleted("Ready for Print")}
              />

              <ProjectFieldEditor
                label="Orders Fulfillment Date"
                value={project.shippedToPacksmithDate || ""}
                onSave={(value) =>
                  handleSaveProjectField("shippedToPacksmithDate", value)
                }
                type="date"
                placeholder="Select shipping date"
                icon={<Hash className="h-4 w-4" />}
                disabled={isStageCompleted("Ready for Print")}
              />
            </div>

            {/* Final Designs Links */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-slate-900">Final Designs</h4>
              </div>

              <div className="space-y-2">
                {project.illustratorFiles && project.illustratorFiles.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Uploaded Final Design File(s)</p>
                    <ul className="list-disc list-inside space-y-1">
                      {project.illustratorFiles.map((file, index) => (
                        <li key={file.id || `${file.url}-${index}`}> 
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            {file.filename || `File ${index + 1}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.finalDesignFileLink && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">External Final Design Link</p>
                    <a
                      href={project.finalDesignFileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      {project.finalDesignFileLink}
                    </a>
                  </div>
                )}

                {!((project.illustratorFiles && project.illustratorFiles.length > 0) || project.finalDesignFileLink) && (
                  <p className="text-sm text-slate-500">No final designs linked yet. Add them in Stage 6.</p>
                )}

                {/* Contacts CSV */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Contacts CSV</p>
                  <a
                    href={contactsCsvDataUri}
                    download={`contacts_${project.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'project'}.csv`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 underline"
                  >
                    Download contacts.csv
                  </a>
                </div>
              </div>
            </div>

            {/* Stage Completion */}
            {isStageActive("Ready for Print") && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Mark Project Complete</span>
                </button>
              </div>
            )}
          </div>
        </FunnelStage>
      )}

      {/* Stage 8: Project Complete */}
      {shouldRenderStage("Project Complete") && (
        <FunnelStage
          ref={projectCompleteStageRef}
          title="Stage 8 — Completed"
          description="This project has been successfully completed and delivered."
          isActive={isStageActive("Project Complete")}
          isCompleted={false}
          topActions={getRevertTopActions("Project Complete")}
        >
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Project Successfully Completed!
            </h3>
            <p className="text-slate-600 mb-6">
              All custom cards have been designed, produced, and delivered.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/admin")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </FunnelStage>
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSave={handleSaveContact}
        contact={editingContact}
        isLoading={isSavingContact}
        availableCreators={PREDEFINED_CONTACT_CREATORS}
      />
    </div>
  );
};

export default ProjectFunnelPage;

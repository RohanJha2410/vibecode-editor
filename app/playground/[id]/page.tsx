"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { Separator } from "@radix-ui/react-separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { TemplateFile, TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bot, FileText, FolderOpen, Save, Settings, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@radix-ui/react-tabs";
import { } from "@/modules/playground/components/playground-editor";
// import { writeFileSync } from "node:fs";
import { useWebContainer } from "@/modules/webcontainers/hooks/useWebContainer";
import WebContainerPreview from "@/modules/webcontainers/components/webcontainer-preview";
import LoadingStep from "@/modules/playground/components/loader";
import { findFilePath } from "@/modules/playground/lib";
import { toast } from "sonner";
import ToggleAI from "@/modules/playground/components/toggle-ai";
import { useAISuggestions } from "@/modules/playground/hooks/useAISuggestion";
import { PlaygroundEditor } from "@/modules/playground/components/playground-editor";

const MainPlaygroundPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const { playgroundData, templateData, isLoading, error, saveTemplateData } =
    usePlayground(id);

    const aiSuggestions = useAISuggestions()

  const {
    setTemplateData,
    setActiveFileId,
    setPlaygroundId,
    setOpenFiles,
    activeFileId,
    closeFile,
    closeAllFiles,
    openFile,
    openFiles,

    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    updateFileContent
  } = useFileExplorer();

  const {
    serverUrl,
    isLoading: containerLoading,
    instance,
    writeFileSync,
    error: containerError,

    //@ts-ignore
  } = useWebContainer({ templateData });

  const lastSyncedContent = useRef<Map<string, string>>(new Map())


  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData, openFiles.length]);

    // Create wrapper functions that pass saveTemplateData
  const wrappedHandleAddFile = useCallback(
    (newFile: TemplateFile, parentPath: string) => {
      return handleAddFile(
        newFile,
        parentPath,
        writeFileSync!,
        instance,
        saveTemplateData
      );
    },
    [handleAddFile, writeFileSync, instance, saveTemplateData]
  );

  const wrappedHandleAddFolder = useCallback(
    (newFolder: TemplateFolder, parentPath: string) => {
      return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
    },
    [handleAddFolder, instance, saveTemplateData]
  );

  const wrappedHandleDeleteFile = useCallback(
    (file: TemplateFile, parentPath: string) => {
      return handleDeleteFile(file, parentPath, saveTemplateData);
    },
    [handleDeleteFile, saveTemplateData]
  );

  const wrappedHandleDeleteFolder = useCallback(
    (folder: TemplateFolder, parentPath: string) => {
      return handleDeleteFolder(folder, parentPath, saveTemplateData);
    },
    [handleDeleteFolder, saveTemplateData]
  );

  const wrappedHandleRenameFile = useCallback(
    (
      file: TemplateFile,
      newFilename: string,
      newExtension: string,
      parentPath: string
    ) => {
      return handleRenameFile(
        file,
        newFilename,
        newExtension,
        parentPath,
        saveTemplateData
      );
    },
    [handleRenameFile, saveTemplateData]
  );

  const wrappedHandleRenameFolder = useCallback(
    (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
      return handleRenameFolder(
        folder,
        newFolderName,
        parentPath,
        saveTemplateData
      );
    },
    [handleRenameFolder, saveTemplateData]
  );

  console.log("templateData", templateData);
  console.log("playgroundData", playgroundData);

  const activeFile = openFiles.find((file) => file.id === activeFileId);

  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  const handleSave = useCallback(async(fileId?:string)=>{
    const targetFileId = fileId || activeFileId
    if(!targetFileId) return

    const fileToSave = openFiles.find((f)=>f.id === targetFileId)
    if(!fileToSave) return

    const latestTemplateData = useFileExplorer.getState().templateData
    if(!latestTemplateData) return

    try {
      const filePath = findFilePath(fileToSave, latestTemplateData)
      if(!filePath){
        toast.error(`Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`)
        return
      }

      const updatedTemplateData = JSON.parse(
        JSON.stringify(latestTemplateData)
      )

      //@ts-ignore
      const updateFileContent = (items: any[]) =>
            // @ts-ignore
          items.map((item) => {
            if ("folderName" in item) {
              return { ...item, items: updateFileContent(item.items) };
            } else if (
              item.filename === fileToSave.filename &&
              item.fileExtension === fileToSave.fileExtension
            ) {
              return { ...item, content: fileToSave.content };
            }
            return item;
          });
        updatedTemplateData.items = updateFileContent(
          updatedTemplateData.items
        );

          // Sync with WebContainer
        if (writeFileSync) {
          await writeFileSync(filePath, fileToSave.content);
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
          if (instance && instance.fs) {
            await instance.fs.writeFile(filePath, fileToSave.content);
          }
        }

        const newTemplateData = await saveTemplateData(updatedTemplateData);
        //@ts-ignore
        setTemplateData(newTemplateData || updatedTemplateData);

        // Update open files
        const updatedOpenFiles = openFiles.map((f) =>
          f.id === targetFileId
            ? {
                ...f,
                content: fileToSave.content,
                originalContent: fileToSave.content,
                hasUnsavedChanges: false,
              }
            : f
        );
        setOpenFiles(updatedOpenFiles);

    toast.success(
          `Saved ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
    } catch (error) {
      console.error("Error saving file:", error);
        toast.error(
          `Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
        throw error;
    }

  },[
    activeFileId,
    openFiles,
    writeFileSync,
    instance,
    saveTemplateData,
    setTemplateData,
    setOpenFiles
  ])

  const handleSaveAll = async () => {
    const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);

    if (unsavedFiles.length === 0) {
      toast.info("No unsaved changes");
      return;
    }

    try {
      await Promise.all(unsavedFiles.map((f) => handleSave(f.id)));
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
    } catch (error) {
      toast.error("Failed to save some files");
    }
  };

   useEffect(()=>{
    const handleKeyDown = (e:KeyboardEvent)=>{
      if(e.ctrlKey && e.key === "s"){
        e.preventDefault()
        handleSave()
      }
    }
     window.addEventListener("keydown", handleKeyDown);
     return () => window.removeEventListener("keydown", handleKeyDown);
  },[handleSave]);


  //Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  //Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading Playground
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
  }

  // No template data
  if (!templateData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <FolderOpen className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-amber-600 mb-2">
          No template data available
        </h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Template
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          // @ts-ignore
          data={templateData}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          title="File Explorer"
          onAddFile={wrappedHandleAddFile}
          onAddFolder={wrappedHandleAddFolder}
          onDeleteFile={wrappedHandleDeleteFile}
          onDeleteFolder={wrappedHandleDeleteFolder}
          onRenameFile={wrappedHandleRenameFile}
          onRenameFolder={wrappedHandleRenameFolder}
        />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 h-12 px-4">
            <SidebarTrigger className="-ml-1 border-white/10" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-col flex-1">
                <h1 className="text-sm font-medium">
                  {playgroundData?.title || "Code Playground"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {openFiles.length} File(s) Open
                  {hasUnsavedChanges && "• Unsaved Changes"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className=" border-white/20 "
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave()}
                      disabled={!activeFile || !activeFile.hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl+S) </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className=" border-white/20 "
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveAll()}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" />
                      All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent >
                    Save All (Ctrl+Shift+S)
                  </TooltipContent>
                </Tooltip>

                <ToggleAI
                isEnabled={aiSuggestions.isEnabled}
                onToggle={aiSuggestions.toggleEnabled}
                suggestionLoading={aiSuggestions.isLoading}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-white/10 bg-black"
                  >
                    <DropdownMenuItem
                      className="hover:bg-zinc-800 cursor-pointer"
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    >
                      {isPreviewVisible ? "Hide" : "Show"} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="hover:bg-zinc-800 cursor-pointer"
                      onClick={closeAllFiles}
                    >
                      Close All Files
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-4rem)]">
            {openFiles.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="border-b border-white/10 bg-zinc-900 backdrop-blur-md">
                  <Tabs
                    value={activeFileId || ""}
                    onValueChange={setActiveFileId}
                  >
                    <div className="flex items-center justify-between px-4 py-2">
                      <TabsList
                        className="
    h-10
    p-1
    rounded-full
    bg-black
    border border-white/10
    flex items-center gap-1
  "
                      >
                        {openFiles.map((file) => (
                          <TabsTrigger
                            key={file.id}
                            value={file.id}
                            className="
    group
    h-8
    px-4
    rounded-full
    text-sm
    text-white/70
    transition-colors

    hover:bg-white/5
    hover:text-white

    data-[state=active]:bg-white
    data-[state=active]:text-black
  "
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              <span>
                                {file.filename}.{file.fileExtension}
                              </span>
                              {file.hasUnsavedChanges && (
                                <span className="ml-2 h-1.5 w-1.5 rounded-full bg-orange-400" />
                              )}

                              <span
                                className="
    ml-2
    h-4 w-4
    rounded-full
    flex items-center justify-center
    opacity-0
    group-hover:opacity-100
    transition
    hover:bg-black/10
    cursor-pointer
    hover:bg-red-300
  "
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeFile(file.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {openFiles.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={closeAllFiles}
                          className="
    h-7
    px-3
    text-xs
    text-white/60
    border border-white/10
    rounded-md
    hover:text-white
    hover:bg-white/5
    transition-colors
    hover:text-red-400
  "
                        >
                          Close All
                        </Button>
                      )}
                    </div>
                  </Tabs>
                </div>
                <div className="flex h-full">
  {/* Editor */}
  <div
    className={`h-full transition-all duration-300 ${
      isPreviewVisible ? "w-1/2" : "w-full"
    }`}
  >
    <PlaygroundEditor
      activeFile={activeFile}
      content={activeFile?.content || ""}
      onContentChange={(value: string) => {
        activeFileId && updateFileContent(activeFileId, value)
      }}
      suggestion={aiSuggestions.suggestion}
      suggestionLoading={aiSuggestions.isLoading}
      suggestionPosition={aiSuggestions.position}
      onAcceptSuggestion={(editor:any, monaco:any)=>aiSuggestions.acceptSuggestion(editor,monaco)}
      onRejectSuggestion={(editor:any)=>aiSuggestions.rejectSuggestion(editor)}
      onTriggerSuggestion={(type:string, editor:any) => aiSuggestions.fetchSuggestion(type, editor)}
    />
  </div>

  {/* Preview */}
  {isPreviewVisible && (
    <div className="w-1/2 h-full border-l border-white/10 bg-zinc-950 transition-all duration-300">
      <WebContainerPreview
        templateData={templateData}
        instance={instance}
        writeFileSync={writeFileSync}
        isLoading={containerLoading}
        error={containerError}
        serverUrl={serverUrl ?? ""}
        forceResetUp={false}
      />
    </div>
  )}
</div>

              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-4">
                <FileText className="h-16 w-16 text-gray-300" />
                <div className="text-center">
                  <p className="text-lg font-medium">No Files Open</p>
                  <p className="text-sm text-gray-500">
                    Select a file from the sidebar to start editing
                  </p>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
};

export default MainPlaygroundPage;

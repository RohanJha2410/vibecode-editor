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
import React, { useEffect, useState } from "react";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { TemplateFile } from "@/modules/playground/lib/path-to-json";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Save, Settings, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@radix-ui/react-tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import PlaygroundEditor from "@/modules/playground/components/playground-editor";

const MainPlaygroundPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const { playgroundData, templateData, isLoading, error, saveTemplateData } =
    usePlayground(id);

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
  } = useFileExplorer();

  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData, openFiles.length]);

  console.log("templateData", templateData);
  console.log("playgroundData", playgroundData);

  const activeFile = openFiles.find((file) => file.id === activeFileId);

  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          // @ts-ignore
          data={templateData}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          title="File Explorer"
          onAddFile={() => {}}
          onAddFolder={() => {}}
          onDeleteFile={() => {}}
          onDeleteFolder={() => {}}
          onRenameFile={() => {}}
          onRenameFolder={() => {}}
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
                      onClick={() => {}}
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
                      onClick={() => {}}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" />
                      All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white ">
                    Save All (Ctrl+Shift+S)
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="default"
                  size="icon"
                  className="bg-white text-black border-white/10 hover:bg-white"
                >
                  <Bot className="size-4" strokeWidth={2.2} />
                </Button>

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
                      onContentChange={() => {}}
                    />
                  </div>

                  {/* Preview */}
                  {isPreviewVisible && (
                    <div className="w-1/2 h-full border-l border-white/10 bg-zinc-900">
                      {/* Preview content */}
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

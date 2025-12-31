"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { Separator } from "@radix-ui/react-separator";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { TemplateFile } from "@/modules/playground/lib/path-to-json";

const MainPlaygroundPage = () => {
  const { id } = useParams<{ id: string }>();

  const { playgroundData, templateData, isLoading, error, saveTemplateData } =
    usePlayground(id);

  const {
    setTemplateData,
    setActiveFileId,
    setPlaygroundId,
    setOpenFiles,
    activeFileId,
    closeAllFiles,
    openFile,
    openFiles,
  } = useFileExplorer();

  useEffect(()=> {setPlaygroundId(id)}, [id, setPlaygroundId])

  useEffect(()=> {
    if(templateData && !openFiles.length){
      setTemplateData(templateData)
    }
  }, [templateData, setTemplateData, openFiles.length])

  console.log("templateData", templateData);
  console.log("playgroundData", playgroundData);

  const activeFile = openFiles.find((file)=>file.id === activeFileId)

  const hasUnsavedChanges = openFiles.some((file)=>file.hasUnsavedChanges)

  const handleFileSelect = (file:TemplateFile) =>{
    openFile(file)
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
          </header>

          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-col flex-1">
              <h1 className="text-sm font-medium">
                {playgroundData?.title || "Code Playground"}
              </h1>
            </div>
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
};

export default MainPlaygroundPage;

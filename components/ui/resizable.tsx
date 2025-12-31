"use client"

import * as React from "react"
import {
  PanelGroup,
  Panel,
  ResizeHandle,
} from "react-resizable-panels"
import { GripVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* PanelGroup */
function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroup>) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

/* Panel */
function ResizablePanel(
  props: React.ComponentProps<typeof Panel>
) {
  return (
    <Panel
      data-slot="resizable-panel"
      {...props}
    />
  )
}

/* Resize handle */
function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-background">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizeHandle>
  )
}

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
}

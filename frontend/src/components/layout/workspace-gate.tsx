"use client";

import type { ReactNode } from "react";
import { useWorkspace } from "@/lib/workspace";
import type { Workspace } from "@/lib/derive";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { RefreshIcon } from "@/components/ui/icons";

export function WorkspaceGate({
  children,
  skeleton,
}: {
  children: (workspace: Workspace) => ReactNode;
  skeleton?: ReactNode;
}) {
  const { status, error, workspace, refresh } = useWorkspace();

  if (status === "error") {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          title="Assessment unavailable"
          detail={error?.message}
          endpoint={error?.endpoint ?? undefined}
          action={
            <Button variant="secondary" icon={<RefreshIcon width={13} height={13} />} onClick={refresh}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (status === "loading" || !workspace) {
    return <div className="p-4 md:p-6">{skeleton ?? <DefaultSkeleton />}</div>;
  }

  return <>{children(workspace)}</>;
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

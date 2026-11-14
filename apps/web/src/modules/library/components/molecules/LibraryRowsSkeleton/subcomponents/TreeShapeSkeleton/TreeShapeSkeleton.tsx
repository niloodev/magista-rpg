import { EMPTY_FOLDER_TEXT } from "@/modules/library/library.constants";

import { CharacterRowSkeleton } from "../../../CharacterRowSkeleton";
import { FolderRowSkeleton } from "../../../FolderRowSkeleton";
import type { TreeShapeSkeletonProps } from "./TreeShapeSkeleton.types";

/**
 * Rows of the GM tree drawn from a stored shape, open folders with the same body as `TreeFolder`.
 */
export function TreeShapeSkeleton({ nodes }: TreeShapeSkeletonProps) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === "character")
          return (
            <CharacterRowSkeleton
              key={index}
              name={node.name}
              subtitle={node.subtitle}
              access={node.access}
              withHandle
              withActions
            />
          );
        return (
          <div key={index}>
            <FolderRowSkeleton
              name={node.name}
              summary={node.summary}
              expanded={node.children !== null}
            />
            {node.children !== null && (
              <div className="space-y-2 border border-t-0 border-teal-500/50 bg-teal-900/10 py-3 pr-2 pl-3 sm:pl-5">
                {node.children.length === 0 ? (
                  <p className="py-2 font-sans text-sm text-muted-strong italic">
                    {EMPTY_FOLDER_TEXT}
                  </p>
                ) : (
                  <TreeShapeSkeleton nodes={node.children} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

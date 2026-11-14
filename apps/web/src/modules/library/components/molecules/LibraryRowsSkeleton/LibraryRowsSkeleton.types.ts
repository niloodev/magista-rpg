import type { ILibraryShape } from "@/modules/library/library.types";

export interface LibraryRowsSkeletonProps {
  shape: ILibraryShape;
  tree?: boolean;
  announce?: boolean;
}

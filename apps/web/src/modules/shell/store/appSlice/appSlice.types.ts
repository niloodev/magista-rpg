import type { SessionSlice } from "@/modules/auth/store/sessionSlice/sessionSlice.types";
import type { LibrarySlice } from "@/modules/library/store/librarySlice/librarySlice.types";
import type { SheetSlice } from "@/modules/sheet/store/sheetSlice/sheetSlice.types";
import type { TableSlice } from "@/modules/table/store/tableSlice/tableSlice.types";

export type AppStore = SessionSlice & TableSlice & SheetSlice & LibrarySlice;

import { configureStore } from "@reduxjs/toolkit";

import uiReducer from "@/store/slices/ui-slice";

/**
 * Redux Toolkit is reserved for cross-cutting client UI state (shell layout,
 * global dialogs/menus). Server data (accounts, opportunities, etc.) belongs
 * in TanStack Query, not Redux - see docs/architecture.md.
 */
export function makeStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

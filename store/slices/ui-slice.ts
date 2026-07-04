import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarCollapsed: boolean;
  commandMenuOpen: boolean;
};

const initialState: UiState = {
  sidebarCollapsed: false,
  commandMenuOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setCommandMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.commandMenuOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setCommandMenuOpen } = uiSlice.actions;
export default uiSlice.reducer;

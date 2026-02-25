import { createSlice } from '@reduxjs/toolkit';

interface DigestState {
  isOpen: boolean;
  isDone: boolean;
}

const initialState: DigestState = {
  isOpen: false,
  isDone: false,
};

const digestSlice = createSlice({
  name: 'digest',
  initialState,
  reducers: {
    openDigest: (state) => { state.isOpen = true; },
    closeDigest: (state) => { state.isOpen = false; },
    markDone: (state) => { state.isDone = true; state.isOpen = false; },
  },
});

export const { openDigest, closeDigest, markDone } = digestSlice.actions;
export default digestSlice.reducer;

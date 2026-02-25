import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

const stored = typeof window !== 'undefined' ? localStorage.getItem('axial_auth') : null;
const parsed = stored ? JSON.parse(stored) : null;

const initialState: AuthState = {
  user: parsed?.user || null,
  token: parsed?.token || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('axial_auth', JSON.stringify(action.payload));
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('axial_auth');
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

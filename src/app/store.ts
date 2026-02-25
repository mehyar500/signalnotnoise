import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import digestSlice from './digestSlice';
import authSlice from './authSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    digest: digestSlice,
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

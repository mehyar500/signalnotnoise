import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

const stored = localStorage.getItem('axial_theme') || 'dark';
document.documentElement.setAttribute('data-theme', stored);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import Clarity from '@microsoft/clarity';
const projectId = "qw4ev4dsxk"

Clarity.init(projectId);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

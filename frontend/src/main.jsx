import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { OrganizationProvider } from './context/OrganizationContext';
import { Toaster } from './components/ui/sonner';

import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="640675607395-26raje2b9fd5qsnefhk04ak2nief1i4d.apps.googleusercontent.com">
      <OrganizationProvider>
        <App />
        <Toaster />
      </OrganizationProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)

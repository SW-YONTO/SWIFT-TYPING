import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isElectron = window.location.protocol === 'file:';

// Only use Clerk when online + not in Electron
const shouldUseClerk = CLERK_KEY && !isElectron && navigator.onLine;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {shouldUseClerk ? (
      <ClerkProvider publishableKey={CLERK_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)

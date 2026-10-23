import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.css'
import App from './App.tsx'
import { AppProvider } from './store/AppContext.tsx'
import { EvidenceProvider } from './store/EvidenceContext.tsx'
import { UIProvider } from './store/UIContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <UIProvider>
        <EvidenceProvider>
          <App />
        </EvidenceProvider>
      </UIProvider>
    </AppProvider>
  </StrictMode>,
)

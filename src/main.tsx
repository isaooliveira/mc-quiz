import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { QuizProvider } from './state/QuizContext';
import { initAnalytics } from './lib/analytics';
import { captureUtmOnce } from './lib/utm';
import './styles.css';

captureUtmOnce();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/quiz">
      <QuizProvider>
        <App />
      </QuizProvider>
    </BrowserRouter>
  </StrictMode>,
);

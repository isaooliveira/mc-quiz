import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Intro } from './screens/Intro';
import { Question } from './screens/Question';
import { LeadGate } from './screens/LeadGate';
import { Result } from './screens/Result';
import { pageview } from './lib/analytics';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    pageview('/quiz' + location.pathname);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/pergunta/:n" element={<Question />} />
      <Route path="/dados" element={<LeadGate />} />
      <Route path="/resultado" element={<Result />} />
      <Route path="*" element={<Intro />} />
    </Routes>
  );
}

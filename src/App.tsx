import { useEffect, useLayoutEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Intro } from './screens/Intro';
import { Question } from './screens/Question';
import { LeadGate } from './screens/LeadGate';
import { Result } from './screens/Result';
import { pageview } from './lib/analytics';
import { scrollToTop } from './lib/nav';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    pageview('/quiz' + location.pathname);
  }, [location.pathname]);

  useLayoutEffect(() => {
    scrollToTop();
    const timers = [0, 50, 240].map((ms) => window.setTimeout(scrollToTop, ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
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

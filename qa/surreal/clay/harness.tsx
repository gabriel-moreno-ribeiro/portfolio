import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../../../src/styles/index.scss';
import FindMyWork from '../../../src/components/Home/FindMyWork';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <main className="home-wrapper" id="main-content">
      <div style={{ height: '60vh' }} />
      <FindMyWork />
      <div style={{ height: '120vh' }} />
    </main>
  </BrowserRouter>,
);

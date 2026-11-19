// The Desmos drawings, off the home page: not in any menu, reached by the address or by
// `open sketches` in the terminal.
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DesmosSketches from '../components/Home/DesmosSketches';
import Footer from '../components/Shared/Footer';
import { useDocumentHead } from '../hooks/useDocumentHead';

export default function SketchesPage() {
  useDocumentHead({
    title: 'Drawings made of equations · Gabriel Moreno Ribeiro',
    description: 'A hobby: drawings made of a few dozen inequalities each, in Desmos.',
    canonical: 'https://gabrielmr.com/sketches',
    noindex: true,
  });

  return (
    <main className="sketches-page" id="main-content">
      <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
      <DesmosSketches />
      <Footer />
    </main>
  );
}

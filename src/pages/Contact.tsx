import { Navigate } from 'react-router-dom';

// Contact now lives at the bottom of the home page; keep the old URL working.
function Contact() {
  return <Navigate to="/#contact" replace />;
}

export default Contact;

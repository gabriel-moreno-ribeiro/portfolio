import Books from "../components/Home/Books";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";

function Library() {
  return (
    <div className="library-page" id="main-content">
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <Books />
      </div>
      <Footer />
    </div>
  );
}

export default Library;

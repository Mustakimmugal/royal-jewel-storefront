import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { mapsUrl, whatsappUrl } from "../data/storeSettings";

export default function SiteLayout() {
  return (
    <div id="top">
      <Navbar />
      <main><Outlet /></main>
      <Footer />
      <a className="store-shortcut location-shortcut" href={mapsUrl} target="_blank" rel="noreferrer" aria-label="Open store location in Maps"><FiMapPin aria-hidden="true" /><span>Location</span></a>
      <a className="store-shortcut whatsapp-shortcut" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><FaWhatsapp aria-hidden="true" /><span>WhatsApp</span></a>
    </div>
  );
}

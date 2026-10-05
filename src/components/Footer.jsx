import { Link } from "react-router-dom";
import { FiArrowUpRight, FiInstagram } from "react-icons/fi";
import { FaPinterestP } from "react-icons/fa";
import Newsletter from "./Newsletter";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top page-wrap">
        <div className="footer-brand-block">
          <Link className="brand footer-brand" to="/">
            <span className="brand-symbol">R<span>✧</span></span>
            <span className="brand-name">ROYAL JEWEL<small>FINE JEWELLERY</small></span>
          </Link>
          <p>Pieces to mark the everyday and the once-in-a-lifetime. Thoughtfully made, forever treasured.</p>
          <div className="social-links"><a href="https://www.instagram.com/" aria-label="Instagram"><FiInstagram /></a><a href="https://www.pinterest.com/" aria-label="Pinterest"><FaPinterestP /></a></div>
        </div>
        <div className="footer-link-column"><h3>Explore</h3><Link to="/shop">Shop all</Link><Link to="/about">Our story</Link><Link to="/gallery">Gallery</Link><Link to="/contact">Contact</Link></div>
        <div className="footer-link-column"><h3>Collections</h3><Link to="/shop?category=Necklaces">Necklaces</Link><Link to="/shop?category=Earrings">Earrings</Link><Link to="/shop?category=Rings">Rings</Link><Link to="/shop?category=Wedding">Wedding edit</Link></div>
        <div className="footer-link-column"><h3>Helpful links</h3><Link to="/cart">Shopping bag</Link><Link to="/wishlist">Wishlist</Link><Link to="/faq">Frequently asked questions</Link><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms &amp; conditions</Link><Link to="/contact">Care &amp; contact</Link></div>
        <div className="footer-news"><Newsletter compact /></div>
      </div>
      <div className="footer-bottom page-wrap"><span>© 2026 Royal Jewel. All rights reserved.</span><span>Made for the moments that matter <b>✧</b></span><a href="#top">Back to top <FiArrowUpRight /></a></div>
    </footer>
  );
}

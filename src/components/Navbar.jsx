import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiHeart, FiMenu, FiSearch, FiShoppingBag, FiX } from "react-icons/fi";
import { useStore } from "../hooks/useStore";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { cartCount, wishlist } = useStore();

  function submitSearch(event) {
    event.preventDefault();
    navigate("/shop" + (search.trim() ? "?search=" + encodeURIComponent(search.trim()) : ""));
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <>
      <div className="announcement-bar"><span>Complimentary delivery on orders over $150</span><i>✧</i><span>Thoughtfully made, forever treasured</span></div>
      <header className="site-header">
        <div className="navbar page-wrap">
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
          <Link className="brand" to="/" aria-label="Royal Jewel home">
            <span className="brand-symbol">R<span>✧</span></span>
            <span className="brand-name">ROYAL JEWEL<small>FINE JEWELLERY</small></span>
          </Link>
          <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="nav-icon" type="button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><FiSearch /></button>
            <Link className="nav-icon nav-count-link" to="/wishlist" aria-label={"Wishlist, " + wishlist.length + " saved"}>
              <FiHeart />{wishlist.length > 0 && <span className="nav-count">{wishlist.length}</span>}
            </Link>
            <Link className="nav-icon nav-bag nav-count-link" to="/cart" aria-label={"Shopping bag, " + cartCount + " items"}>
              <FiShoppingBag />{cartCount > 0 && <span className="nav-count">{cartCount}</span>}
            </Link>
          </div>
        </div>
        {searchOpen && (
          <form className="nav-search page-wrap" onSubmit={submitSearch}>
            <FiSearch />
            <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search necklaces, earrings, rings..." aria-label="Search products" />
            <button type="submit">Search <FiArrowUpRight /></button>
          </form>
        )}
      </header>
    </>
  );
}

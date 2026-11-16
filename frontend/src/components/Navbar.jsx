import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiGrid, FiHeart, FiHome, FiLogOut, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../hooks/useAuth";
import { formatINR } from "../utils/currency";
import { freeShippingThreshold } from "../data/storeSettings";

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
  const { user, signOut } = useAuth();
  const accountPath = user ? "/account" : "/login";

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  }

  function submitSearch(event) {
    event.preventDefault();
    navigate("/shop" + (search.trim() ? "?search=" + encodeURIComponent(search.trim()) : ""));
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <>
      <div className="announcement-bar"><span>{"Complimentary delivery on orders over " + formatINR(freeShippingThreshold)}</span><i>✧</i><span>Thoughtfully made, forever treasured</span></div>
      <header className="site-header">
        <div className="navbar page-wrap">
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
          <Link className="brand" to="/" aria-label="MH JEWELLERS home">
            <span className="brand-symbol"><img src="/public/mh-jewellers-logo-transparent.png" alt="MH JEWELLERS" /><span>✧</span></span>
            <span className="brand-name">MH JEWELLERS<small>FINE JEWELLERY</small></span>
          </Link>
          <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            {user && user.role !== "customer" && <NavLink className="nav-admin-menu-link" to="/admin" onClick={() => setMenuOpen(false)}><FiGrid /> Dashboard</NavLink>}
          </nav>
          <div className="nav-actions">
            <Link className="nav-icon" to={accountPath} aria-label={user ? "Profile" : "Sign in"} title={user ? "Profile" : "Sign in"}><FiUser /></Link>
            {user && user.role !== "customer" && <Link className="nav-admin-link" to="/admin"><FiGrid /> Dashboard</Link>}
            {user ? <button className="nav-icon nav-signout" type="button" onClick={handleSignOut} aria-label="Sign out" title="Sign out"><FiLogOut /></button> : <Link className="nav-register-link" to="/register">Register</Link>}
            <button className="nav-icon nav-search-toggle" type="button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><FiSearch /></button>
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
        <form className="nav-mobile-search page-wrap" onSubmit={submitSearch}>
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jewellery, rings, earrings…" aria-label="Search products" />
          <button type="submit" aria-label="Search"><FiArrowUpRight /></button>
        </form>
      </header>
      <nav className="mobile-bottom-nav" aria-label="Quick navigation">
        <NavLink to="/" end><FiHome /><span>Home</span></NavLink>
        <NavLink to="/shop"><FiGrid /><span>Shop</span></NavLink>
        <NavLink to="/wishlist"><FiHeart /><span>Wishlist{wishlist.length ? ` (${wishlist.length})` : ""}</span></NavLink>
        <NavLink to="/cart"><FiShoppingBag /><span>Bag{cartCount ? ` (${cartCount})` : ""}</span></NavLink>
        <NavLink to={accountPath}><FiUser /><span>{user ? "Account" : "Sign in"}</span></NavLink>
      </nav>
    </>
  );
}

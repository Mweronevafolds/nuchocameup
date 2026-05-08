import { useState, useEffect } from "react";
import { ShoppingBag, Search, X, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/logo-2fly.png";

export default function StoreHeader() {
  const navigate = useNavigate();
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Change header style after scrolling 20px */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "bg-black border-b border-white/5"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 gap-4 max-w-screen-2xl mx-auto">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group" aria-label="2FLY® Daily Home">
            <img
              src={logo}
              alt="2FLY® Daily"
              className="h-11 object-contain animate-spin180 transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_8px_rgba(0,240,255,0.6))]"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link
              to="/"
              className="text-sm font-display font-medium text-white/60 hover:text-white transition-colors duration-200 tracking-wide"
            >
              Shop
            </Link>
            <Link
              to="/?sort=newest"
              className="text-sm font-display font-medium text-white/60 hover:text-white transition-colors duration-200 tracking-wide"
            >
              New In
            </Link>
          </nav>

          {/* Desktop search bar */}
          <div className="hidden sm:flex flex-1 max-w-xs">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex w-full items-center gap-2 animate-scale-in">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="✨ Ask AI: 'Comfy black hoodie under 5k'"
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm cyber-input focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/40 hover:border-electric-blue/40 hover:text-white/70 transition-all duration-300 group"
                aria-label="Open search"
                id="header-search-btn"
              >
                <span className="font-body">✨ Search with AI...</span>
                <kbd className="ml-auto text-[10px] font-mono-cyber text-white/20 border border-white/10 px-1.5 py-0.5 rounded hidden lg:block">⌘K</kbd>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Mobile search */}
            <button
              aria-label="Search"
              id="mobile-search-btn"
              className="sm:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={19} />
            </button>

            {/* Cart */}
            <button
              aria-label="Shopping cart"
              id="header-cart-btn"
              onClick={openCart}
              className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <ShoppingBag size={19} className="group-hover:scale-110 transition-transform duration-200" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-bold font-mono-cyber text-black animate-scale-in">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              aria-label="Toggle menu"
              id="mobile-menu-btn"
              className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile search input */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3 animate-slide-up">
            <form onSubmit={handleSearch} className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-electric-blue" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles, vibes..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm cyber-input"
              />
            </form>
          </div>
        )}

        {/* Mobile nav menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 animate-slide-up">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {[
                { label: "Shop All", to: "/" },
                { label: "New In", to: "/?sort=newest" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-display font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-xs font-mono-cyber text-white/20 hover:text-white/40 transition-colors mt-2"
              >
                [admin]
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

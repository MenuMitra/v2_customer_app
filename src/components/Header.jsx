import React, { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { useSidebar } from "../contexts/SidebarContext";
// import { useAuth } from "../contexts/AuthContext";
// import { useTheme } from "../contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import TestEnvironmentBanner from "./TestEnvironmentBanner";
import OutletInfoBanner from "./OutletInfoBanner";
import { useLocation } from "react-router-dom";
import logo2 from "../assets/mm-logo.png";


function Header() {
  const mainBarRef = useRef(null);
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();
  // const { getUserName } = useAuth();
  const location = useLocation();
  // const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  // Treat dynamic outlet root like "/o123/s45/t6" as home as well
  const isHomePath =
    location.pathname === "/" || /^\/o\d+\/s\d+\/t\d+\/?$/.test(location.pathname);

  // Function to check if current route is profile related
  const isProfileRoute = () => {
    const pathname = location.pathname;
    return (
      pathname === "/profile" ||
      pathname.startsWith("/profile/") ||
      pathname === "/edit-profile"
    );
  };

  // Function to check if banner should be hidden
  const shouldHideBanner = () => {
    return (
      location.pathname.includes("/outlet-details") ||
      isProfileRoute()
    );
  };

  // Modify the useEffect to get first name
  // useEffect(() => {
  //   const fullName = getUserName();
  //   const firstName = fullName?.split(" ")[0];
  //   setUserName(firstName);
  // }, [getUserName]);

  // Keep scroll handler in separate useEffect with CSS-based approach
  // Using transform instead of position changes to prevent layout shifts
  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;

    const handleScroll = () => {
      if (!ticking) {
        // Use requestAnimationFrame for smoother updates
        window.requestAnimationFrame(() => {
          if (!mainBarRef.current) {
            ticking = false;
            return;
          }

          const isScrolled = window.scrollY > 50;
          
          // Only update if state changed to prevent unnecessary DOM updates
          if (isScrolled !== lastScrolled) {
            lastScrolled = isScrolled;
            mainBarRef.current.dataset.scrolled = isScrolled;
            
            // Use classList toggle for better performance
            if (isScrolled) {
              mainBarRef.current.classList.add('header-scrolled');
            } else {
              mainBarRef.current.classList.remove('header-scrolled');
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === "/") return "MenuMitra";
    if (path.startsWith("/checkout")) return "Checkout";
    if (path === "/edit-profile") return "Edit Profile";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/search")) return "Search";
    if (path.startsWith("/orders")) return "Orders";
    if (path.startsWith("/favourites")) return "Favourite";
    if (path.startsWith("/categories")) return "Categories";
    if (path.startsWith("/menu")) return "Menu";
    if (path.startsWith("/category-menu/")) return "Categories View";
    if (path.startsWith("/order-detail")) return "Order Details";
    if (path.startsWith("/savings")) return "Savings";
    if (path.startsWith("/outlet-details")) return "Outlet Details";
    if (path.startsWith("/product/") || path.startsWith("/product-detail"))

      return "Product Details";
    return "";
  };

  return (
    <>
      <TestEnvironmentBanner />
      {/* Overlay always rendered, class toggled by isOpen */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={closeSidebar}
      ></div>
      {/* <Sidebar /> */}
      {/* Sidebar always rendered, class toggled by isOpen for smooth animation */}
      <header className="relative block">
        <div className="bg-white w-full transition-all duration-300 header-bar" ref={mainBarRef}>
          <div className="container mx-auto px-4">
            <div className="relative flex items-center justify-between py-3 min-h-[60px]">
              {/* Left content: back arrow for non-home pages, logo+title for home */}
              <div className="flex items-center gap-2">
                {!isHomePath && (
                  <button
                    className="p-0 mr-2 bg-transparent border-0 flex items-center justify-center text-[#222] text-[22px]"
                    onClick={() => navigate(-1)}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                )}
                {/* Logo and title for home page, left-aligned */}
                {/* Logo and title for home page, left-aligned */}
                {isHomePath && (
                  <a
                    href="https://menumitra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 no-underline"
                    aria-label="Go to MenuMitra website"
                  >
                    <img
                      src={logo2}
                      alt="MenuMitra Logo"
                      className="h-10 w-10 mr-0"
                    />
                    <span className="text-lg font-semibold text-gray-900 leading-none">
                      MenuMitra
                    </span>
                  </a>
                )}
              </div>
              {/* Centered header title for all non-home pages */}
              {!isHomePath && getHeaderTitle() && (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                >
                  <h5 className="m-0 whitespace-nowrap text-lg font-medium text-gray-900">
                    {getHeaderTitle()}
                  </h5>
                </div>
              )}
              <div className="mid-content hidden" />
              <div className="flex items-center gap-2">
                <Link to="/search" className="flex items-center justify-center text-gray-800 hover:text-blue-600 transition-colors">
                  <i className="text-xl fas fa-search"></i>
                </Link>
                <a
                  href="#"
                  className="ml-2 flex items-center justify-center text-gray-800 hover:text-blue-600 transition-colors"
                  onClick={(e) => { e.preventDefault(); toggleSidebar(); }}
                >
                  <i className="text-xl fas fa-bars"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Sidebar isOpen={isOpen} onClose={closeSidebar} />
      {!shouldHideBanner() && <OutletInfoBanner />}
    </>
  );
}

export default Header;

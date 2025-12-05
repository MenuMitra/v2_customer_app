import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useThemeColor } from "../contexts/ThemeColorContext";
import "../assets/css/style.css";
import ThemeColorOffcanvas from "./ThemeColorOffcanvas";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import MenuMitra from "./MenuMitra";
import axios from "axios";
import FeedbackButton from "./FeedbackButton";

function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const { user, isAuthenticated, handleLogout } = useAuth();
  const { getCartCount, clearCart } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const { showThemeColorOffcanvas, toggleThemeColorOffcanvas } =
    useThemeColor();
  const cartCount = getCartCount();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = () => {
    closeSidebar();
  };

  const isOrderRoute = () => {
    const pathname = location.pathname;
    return (
      pathname === "/orders" ||
      pathname.startsWith("/orders/") ||
      pathname.startsWith("/order-detail/")
    );
  };

  const isProfileRoute = () => {
    const pathname = location.pathname;
    return (
      pathname === "/profile" ||
      pathname.startsWith("/profile/") ||
      pathname === "/edit-profile"
    );
  };

  const onLogoutClick = (e) => {
    e.preventDefault();
    clearCart();
    handleLogout();
    console.log("Logout successful, attempting navigation to /");
    setTimeout(() => {
      navigate("/");
    }, 0);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogoutAndCloseSidebar = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  return (
    <div className={`sidebar style-2 right${isOpen ? " show" : ""} flex flex-col`}>
      {isAuthenticated && (
        <div className="user-info p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="avatar-lg mr-3">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="rounded-full w-[60px] h-[60px] object-cover"
                  />
                ) : (
                  <div className="rounded-full bg-primary flex items-center justify-center text-white w-[60px] h-[60px] text-2xl">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div>
                <h6 className="mb-1 text-gray-900">{user?.name}</h6>
                <small className="text-gray-500">{user?.mobile}</small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-link text-gray-900 p-0"
              aria-label="Close sidebar"
              onClick={closeSidebar}
            >
              <i className="fa-solid fa-xmark fa-lg"></i>
            </button>
          </div>
        </div>
      )}
      {/* <a href="index.html" className="side-menu-logo">
          <img src="assets/images/logo-sidebar.svg" alt="logo" />
        </a> */}
      <ul className="nav navbar-nav">
        {/* <li className="nav-label">Main Menu</li> */}
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link flex items-center ${isActive
                ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                : ""
              }`
            }
            onClick={handleLinkClick}
            end
          >
            <span className="dz-icon flex items-center justify-center mr-2">
              <i className="fa-solid fa-utensils"></i>
            </span>
            <span>Menu</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `nav-link flex items-center ${isActive
                ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                : ""
              }`
            }
            onClick={handleLinkClick}
          >
            <span className="dz-icon flex items-center justify-center mr-2">
              <i className="fa-solid fa-list"></i>
            </span>
            <span>Category</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `nav-link flex items-center ${isActive
                ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                : ""
              }`
            }
            onClick={handleLinkClick}
          >
            <span className="dz-icon flex items-center justify-center mr-2">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <span>Search</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/favourites"
            className={({ isActive }) =>
              `nav-link flex items-center ${isActive
                ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                : ""
              }`
            }
            onClick={handleLinkClick}
          >
            <span className="dz-icon flex items-center justify-center mr-2">
              <i className="fa-solid fa-heart"></i>
            </span>
            <span>Favourites</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/checkout"
            className="sidebar-link flex items-center"
            onClick={handleLinkClick}
          >
            <span className="dz-icon flex items-center justify-center mr-2">
              <i className="fa-solid fa-shopping-cart"></i>
            </span>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="badge rounded-full ml-auto bg-[#dc3545] text-white min-w-[18px] h-[18px] flex items-center justify-center text-xs">
                {cartCount}
              </span>
            )}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `nav-link flex items-center ${isOrderRoute()
                ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                : ""
              }`
            }
            onClick={handleLinkClick}
          >
            <span className="dz-icon flex items-center justify-center mr-2">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </span>
            <span>Orders</span>
          </NavLink>
        </li>

        {isAuthenticated && (
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `nav-link flex items-center ${isProfileRoute()
                  ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                  : ""
                }`
              }
              onClick={handleLinkClick}
            >
              <span className="dz-icon flex items-center justify-center mr-2">
                <i className="fa-solid fa-user"></i>
              </span>
              <span>Profile</span>
            </NavLink>
          </li>
        )}

        {user && (
          <li>
            <NavLink
              to="/logout"
              className={({ isActive }) =>
                `nav-link flex items-center ${isActive
                  ? "active bg-success text-white font-bold px-2 rounded-[2rem]"
                  : ""
                }`
              }
              onClick={handleLogoutAndCloseSidebar}
            >
              <span className="dz-icon flex items-center justify-center mr-2">
                <i className="fa-solid fa-power-off font_sie_14 text-[#dc3545]"></i>
              </span>
              <span className="text-danger">Logout</span>
            </NavLink>
          </li>
        )}
        {/* Only show FeedbackButton if user is logged in */}
        {user && (
          <li className="mt-2 mb-2 flex justify-center">
            <FeedbackButton onOpen={closeSidebar} />
          </li>
        )}
        <li className="nav-label">Settings</li>

        <li>
          <div className="mode">
            <div className="nav-link flex items-center justify-between">
              <div className="flex items-center">
                <span className="dz-icon mr-2">
                  {isDarkMode ? (
                    <i className="fa-solid fa-sun"></i>
                  ) : (
                    <i className="fa-solid fa-moon"></i>
                  )}
                </span>
              </div>
              <div className="custom-switch">
                <input
                  type="checkbox"
                  className="switch-input theme-btn"
                  id="toggle-dark-menu"
                  checked={isDarkMode}
                  onChange={toggleTheme}
                />
                <label
                  className="custom-switch-label"
                  htmlFor="toggle-dark-menu"
                />
              </div>
            </div>
          </div>
        </li>
      </ul>



      {/* <a
      href="javascript:void(0);"
      onClick={() => alert('Delete Cookie clicked!')}
      className="btn btn-primary btn-sm cookie-btn"
    >
      Delete Cookie
    </a> */}
      <div className="mt-auto px-3 pb-3">
        <MenuMitra />
      </div>
      <ThemeColorOffcanvas
        show={showThemeColorOffcanvas}
        onClose={() => toggleThemeColorOffcanvas(false)}
      />
      <ConfirmLogoutModal
        show={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={(e) => {
          setShowLogoutConfirm(false);
          if (typeof closeSidebar === "function") closeSidebar();
          onLogoutClick(e || new Event('click'));
        }}
      />
    </div>
  );
}

export default Sidebar;

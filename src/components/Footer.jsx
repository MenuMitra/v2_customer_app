import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useOutlet } from "../contexts/OutletContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

function Footer() {
  const { outletCode, sectionId, tableId } = useOutlet();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const location = useLocation();
  const { user, setShowAuthOffcanvas } = useAuth();
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

  return (
    <div>
      <div
        className="menubar-area style-2 footer-fixed border-top border-3 border-primary"
        style={{ boxShadow: "0 -10px 6px -1px rgba(0,0,0,0.1)" }}
      >
        <div className="toolbar-inner menubar-nav">
          <NavLink
            to={
              outletCode && sectionId && tableId
                ? `/o${outletCode}/s${sectionId}/t${tableId}`
                : "/"
            }
            className={({ isActive }) =>
              `nav-link ${isActive ? "active text-primary" : ""}`
            }
            end
          >
            <i className="fa-solid fa-house"></i>
          </NavLink>
          <NavLink
            onClick={() => {
              if (!user) {
                setShowAuthOffcanvas(true);
                return;
              }
            }}
            to="/favourites"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active text-primary" : ""}`
            }
          >
            <i className="fa-solid fa-heart"></i>
          </NavLink>
          <NavLink
            onClick={() => {
              if (!user) {
                setShowAuthOffcanvas(true);
                return;
              }
            }}
            to="/checkout"
            className={({ isActive }) =>
              `nav-link position-relative d-flex align-items-center justify-content-center ${
                isActive ? "active text-primary" : ""
              }`
            }
          >
            <span style={{ position: "relative", display: "inline-block" }}>
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span
                  className="position-absolute badge rounded-pill"
                  style={{
                    bottom: "14px",
                    left: "15px",
                    fontSize: "0.6rem",
                    minWidth: 13,
                    height: 13,
                    backgroundColor: "#F44336",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    zIndex: 2,
                    border: "1px solid white",
                  }}
                >
                  {/* {cartCount} */}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink
            onClick={() => {
              if (!user) {
                setShowAuthOffcanvas(true);
                return;
              }
            }}
            to="/orders"
            className={() =>
              `nav-link ${isOrderRoute() ? "active text-primary" : ""}`
            }
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
          </NavLink>
          <NavLink
            to="/profile"
            className={() =>
              `nav-link ${isProfileRoute() ? "active text-primary" : ""}`
            }
          >
            <i className="fa-solid fa-user"></i>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default Footer;

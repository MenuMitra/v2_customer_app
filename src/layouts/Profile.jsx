import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import MenuMitra from "../components/MenuMitra";
import ConfirmLogoutModal from "../components/ConfirmLogoutModal";
import { useOutlet } from "../contexts/OutletContext";

function Profile() {
  const { handleLogout, user, isAuthenticated, setShowAuthOffcanvas } =
    useAuth();
  const { clearCart } = useCart();
  // const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  // const { openModal } = useModal();
  const { outletCode, sectionId, tableId } = useOutlet();

  const iconStyle = {
    // color: "#000",
    opacity: "0.7",
    minWidth: "20px",
  };

  const onLogoutClick = (e) => {
    e.preventDefault();
    clearCart();
    handleLogout();
    // Build canonical root preserving o/s/t if available
    const code = outletCode || localStorage.getItem("outletCode");
    const sec = sectionId || localStorage.getItem("sectionId");
    const tbl = tableId || localStorage.getItem("tableId");
    const target = code && sec && tbl ? `/o${code}/s${sec}/t${tbl}` : "/";
    navigate(target, { replace: true });
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    setShowAuthOffcanvas(true);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <Header />

      <div className="page-content pb-2 ">
        <div className="container profile-area">
          <div
            className="profile rounded-4 mx-1 mt-3"
            onClick={!isAuthenticated ? handleLoginClick : undefined}
            style={!isAuthenticated ? { cursor: "pointer" } : {}}
          >
            <div className="d-flex align-items-center mb-0 ">
              <div className="about-profile ">
                <h5 className="sub-title mb-2">
                  {isAuthenticated ? `Hello, ${user?.name}` : "Hello User"}
                </h5>
                {!isAuthenticated && (
                  <button
                    className="btn btn-light position-absolute top-0 end-0 m-3 fw-semibold rounded-2 px-3 py-2 border-2 border-white shadow-none"
                    style={{ zIndex: 10 }}
                    onClick={handleLoginClick}
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="profile-content border-0">
            <div className="row g-2">
              <div className="col-6">
                <Link
                  to="/orders"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-clock-rotate-left me-2 text-dark" />
                  My Orders
                </Link>
              </div>
              <div className="col-6">
                <Link
                  to="/search"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-magnifying-glass me-2 text-dark" />
                  Search
                </Link>
              </div>
              <div className="col-6">
                <Link
                  to="/savings"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-piggy-bank me-2 text-dark" />
                  Savings
                </Link>
              </div>
              <div className="col-6">
                <Link
                  to="/favourites"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-heart me-2 text-dark" />
                  Favourites
                </Link>
              </div>
              <div className="col-6">
                <Link
                  to="/menu"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-utensils me-2 text-dark" />
                  Menu
                </Link>
              </div>
              <div className="col-6">
                <Link
                  to="/categories"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-list me-2 text-dark" />
                  Category
                </Link>
              </div>
              
              <div className="col-6 mx-auto">
                <Link
                  to="/checkout"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-shopping-cart me-2 text-dark" />
                  Checkout
                </Link>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <div className="account-section mt-4">
              <h5 className="mb-3">Account</h5>
              <div className="row g-2">
                <div className="col-10 mx-auto">
                  <Link
                    to="/edit-profile"
                    className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                  >
                    <i className="fa-solid fa-user me-2 text-dark" />
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="d-flex flex-column align-items-center my-4">
        {isAuthenticated && (
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setShowLogoutConfirm(true); }}
            className="btn btn-outline-danger d-flex align-items-center gap-2 mb-5"
            style={{ color: "#8B0000", borderColor: "#f5c2c7", borderWidth: "2px", backgroundColor: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8d7da"; // light red
              e.currentTarget.style.borderColor = "#dc3545"; // danger red
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#f5c2c7"; // light border
            }}
          >
            <i className="fa-solid fa-power-off" style={{ fontSize: 16, color: "#8B0000" }} />
            <span style={{ color: "#8B0000" }}>Logout</span>
          </a>
        )}
        <MenuMitra />
      </div>
      <ConfirmLogoutModal
        show={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={(e) => { setShowLogoutConfirm(false); onLogoutClick(e || new Event('click')); }}
      />
      <Footer />
    </>
  );
}

export default Profile;

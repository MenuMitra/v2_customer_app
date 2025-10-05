import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import MenuMitra from "../components/MenuMitra";
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
                  to="/all-outlets"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-store me-2 text-dark" />
                  All Outlets
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
                  to="/checkout"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3"
                >
                  <i className="fa-solid fa-shopping-cart me-2 text-dark" />
                  Cart
                </Link>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <div className="account-section mt-4">
              <h5 className="mb-3">Account</h5>
              <ul>
                <li className="text-dark">
                  <Link to="/edit-profile">
                    <i className="fa-solid fa-user me-2 text-dark" style={iconStyle} />
                    <span className="text-dark">Edit Profile</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="d-flex flex-column align-items-center my-4">
        {isAuthenticated && (
          <a
            href="#"
            onClick={onLogoutClick}
            className="text-dark fw-medium fs-5 text-decoration-none d-flex align-items-center gap-2 mb-5"
          >
            <i className="fa-solid fa-power-off text-dark" style={{ fontSize: 16 }} />
            <span className="text-dark">Logout</span>
          </a>
        )}
        <MenuMitra />
      </div>
      <Footer />
    </>
  );
}

export default Profile;

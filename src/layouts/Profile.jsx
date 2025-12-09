import { useState } from "react";
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
  const navigate = useNavigate();
  const { outletCode, sectionId, tableId } = useOutlet();

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

      <div className="page-content pb-2">
        <div className="max-w-[1200px] mx-auto px-4 profile-area">
          <div
            className={`profile rounded-2xl mx-1 mt-3 ${!isAuthenticated ? "cursor-pointer" : ""}`}
            onClick={!isAuthenticated ? handleLoginClick : undefined}
          >
            <div className="flex items-center mb-0">
              <div className="about-profile">
                <h5 className="sub-title mb-2">
                  {isAuthenticated ? `Hello, ${user?.name}` : "Hello User"}
                </h5>
                {!isAuthenticated && (
                  <button
                    className="absolute top-0 right-0 m-3 font-semibold rounded-[50px] px-3 py-2 border-2 border-white shadow-none bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors z-10"
                    onClick={handleLoginClick}
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="profile-content border-0">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Link
                  to="/orders"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-clock-rotate-left mr-2 text-[#212529]" />
                  My Orders
                </Link>
              </div>
              <div>
                <Link
                  to="/search"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-magnifying-glass mr-2 text-[#212529]" />
                  Search
                </Link>
              </div>
              <div>
                <Link
                  to="/savings"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-piggy-bank mr-2 text-[#212529]" />
                  Savings
                </Link>
              </div>
              <div>
                <Link
                  to="/all-outlets"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-store mr-2 text-[#212529]" />
                  All Outlets
                </Link>
              </div>
              <div>
                <Link
                  to="/favourites"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-heart mr-2 text-[#212529]" />
                  Favourites
                </Link>
              </div>
              <div>
                <Link
                  to="/menu"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-utensils mr-2 text-[#212529]" />
                  Menu
                </Link>
              </div>
              <div>
                <Link
                  to="/categories"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-list mr-2 text-[#212529]" />
                  Category
                </Link>
              </div>
              
              <div>
                <Link
                  to="/checkout"
                  className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-shopping-cart mr-2 text-[#212529]" />
                  Checkout
                </Link>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <div className="account-section mt-4">
              <h5 className="mb-3 text-lg font-semibold">Account</h5>
              <div className="grid grid-cols-1 gap-2">
                <div className="w-5/6 mx-auto">
                  <Link
                    to="/edit-profile"
                    className="w-full flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                  >
                    <i className="fa-solid fa-user mr-2 text-[#212529]" />
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center my-4 pb-24">
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); setShowLogoutConfirm(true); }}
            className="flex items-center gap-2 mb-5 px-4 py-2 text-[#8B0000] border-2 border-[#f5c2c7] bg-transparent hover:bg-[#f8d7da] hover:border-[#dc3545] transition-colors rounded-lg"
          >
            <i className="fa-solid fa-power-off text-base text-[#8B0000]" />
            <span className="text-[#8B0000]">Logout</span>
          </button>
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

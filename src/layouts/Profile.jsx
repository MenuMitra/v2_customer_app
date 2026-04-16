import { useState, useCallback, useMemo } from "react";
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
  const { outletCode, sectionId, tableNumber } = useOutlet();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isQrSession = useMemo(() => {
    const code = outletCode || localStorage.getItem("outletCode");
    const sec = sectionId || localStorage.getItem("sectionId");
    const tbl = tableNumber || localStorage.getItem("tableNumber");
    return !!(code && sec && tbl);
  }, [outletCode, sectionId, tableNumber]);

  // Memoize navigation target to prevent recalculation on every render
  const navigationTarget = useMemo(() => {
    const code = outletCode || localStorage.getItem("outletCode");
    const sec = sectionId || localStorage.getItem("sectionId");
    const tbl = tableNumber || localStorage.getItem("tableNumber");
    return code && sec && tbl ? `/o${code}/s${sec}/t${tbl}` : "/";
  }, [outletCode, sectionId, tableNumber]);

  const onLogoutClick = useCallback((e) => {
    e.preventDefault();
    clearCart();
    handleLogout();
    navigate(navigationTarget, { replace: true });
  }, [clearCart, handleLogout, navigate, navigationTarget]);

  const handleLoginClick = useCallback((e) => {
    e.preventDefault();
    setShowAuthOffcanvas(true);
  }, [setShowAuthOffcanvas]);

  return (
    <>
      <Header />

      <div className="page-content pb-2" style={{ minHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
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
                    className="absolute top-2 right-2  font-semibold rounded-[50px] px-3 py-2 border-2 border-white shadow-none bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors z-10"
                    onClick={handleLoginClick}
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="profile-content border-0 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Link
                  to="/orders"
                  className="w-full flex font-bold items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-clock-rotate-left mr-2 text-[#212529]" />
                  My Orders
                </Link>
              </div>
              <div>
                <Link
                  to="/search"
                  className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-magnifying-glass mr-2 text-[#212529]" />
                  Search
                </Link>
              </div>
              <div>
                <Link
                  to="/savings"
                  className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-piggy-bank mr-2 text-[#212529]" />
                  Savings
                </Link>
              </div>
              {!isQrSession && (
                <div>
                  <Link
                    to="/all-outlets"
                    className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                  >
                    <i className="fa-solid fa-store mr-2 text-[#212529]" />
                    All Outlets
                  </Link>
                </div>
              )}
              <div>
                <Link
                  to="/favourites"
                  className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-heart mr-2 text-[#212529]" />
                  Favourites
                </Link>
              </div>
              <div>
                <Link
                  to="/menu"
                  className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-utensils mr-2 text-[#212529]" />
                  Menu
                </Link>
              </div>
              <div>
                <Link
                  to="/categories"
                  className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-list mr-2 text-[#212529]" />
                  Category
                </Link>
              </div>
              
              <div>
                <Link
                  to="/checkout"
                  className="w-full font-bold flex items-center justify-center py-3 bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors rounded-lg"
                >
                  <i className="fa-solid fa-shopping-cart mr-2 text-[#212529]" />
                  Checkout
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center mt-3 mb-3 px-4">
            <MenuMitra />
          </div>
        </div>
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

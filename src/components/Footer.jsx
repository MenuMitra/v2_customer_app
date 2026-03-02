import { NavLink, useLocation } from "react-router-dom";
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
      <div className="fixed bottom-0 left-0 w-full bg-white p-[15px] rounded-t-[10px] z-[999] shadow-[0_-10px_6px_-1px_rgba(0,0,0,0.1)] border-t border-[#E8EFF3]">
        <div className="flex items-center max-w-[1000px] mx-auto px-0">
          <NavLink
            to={
              outletCode && sectionId && tableId
                ? `/o${outletCode}/s${sectionId}/t${tableId}`
                : "/"
            }
            className={({ isActive }) =>
              `w-1/4 text-center text-[#293041] text-[18px] relative flex justify-center items-center py-0 transition-colors duration-200 ${isActive
                ? "text-[#027335] after:content-[''] after:absolute after:-bottom-[15px] after:left-1/2 after:w-[70px] after:h-[6px] after:bg-[#027335] after:rounded-t-[10px] after:-translate-x-1/2"
                : "hover:text-[#027335]"
              }`
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
              `w-1/4 text-center text-[#293041] text-[18px] relative flex justify-center items-center py-0 transition-colors duration-200 ${isActive
                ? "text-[#027335] after:content-[''] after:absolute after:-bottom-[15px] after:left-1/2 after:w-[70px] after:h-[6px] after:bg-[#027335] after:rounded-t-[10px] after:-translate-x-1/2"
                : "hover:text-[#027335]"
              }`
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
              `w-1/4 text-center text-[#293041] text-[18px] relative flex justify-center items-center py-0 transition-colors duration-200 ${isActive
                ? "text-[#027335] after:content-[''] after:absolute after:-bottom-[15px] after:left-1/2 after:w-[70px] after:h-[6px] after:bg-[#027335] after:rounded-t-[10px] after:-translate-x-1/2"
                : "hover:text-[#027335]"
              }`
            }
          >
            <span className="relative inline-block">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span className="absolute bottom-[14px] left-[15px] text-[0.6rem] min-w-[13px] h-[13px] bg-[#F44336] text-white px-1 py-0 z-[2] rounded-full flex items-center justify-center border border-white">
                  {cartCount}
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
              `w-1/4 text-center text-[#293041] text-[18px] relative flex justify-center items-center py-0 transition-colors duration-200 ${isOrderRoute()
                ? "text-[#027335] after:content-[''] after:absolute after:-bottom-[15px] after:left-1/2 after:w-[70px] after:h-[6px] after:bg-[#027335] after:rounded-t-[10px] after:-translate-x-1/2"
                : "hover:text-[#027335]"
              }`
            }
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
          </NavLink>
          <NavLink
            to="/profile"
            className={() =>
              `w-1/4 text-center text-[#293041] text-[18px] relative flex justify-center items-center py-0 transition-colors duration-200 ${isProfileRoute()
                ? "text-[#027335] after:content-[''] after:absolute after:-bottom-[15px] after:left-1/2 after:w-[70px] after:h-[6px] after:bg-[#027335] after:rounded-t-[10px] after:-translate-x-1/2"
                : "hover:text-[#027335]"
              }`
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

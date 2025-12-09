import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { OutletProvider } from "./contexts/OutletContext";
import Home from "./layouts/Home";
import AllOutlets from "./layouts/AllOutlets";
import AuthOffcanvas from "./components/Auth/AuthOffcanvas";
import Favourite from "./layouts/Favourite";
import SidebarProvider from "./contexts/SidebarContext";
import Sidebar from "./components/Sidebar"; 
import Checkout from "./layouts/Checkout";
import Orders from "./layouts/Orders";
import OrderDetail from "./layouts/OrderDetail";
import Profile from "./layouts/Profile";
import EditProfile from "./layouts/EditProfile";
import Categories from "./layouts/Categories";
import CategoryFilteredMenuList from "./layouts/CategoryFilteredMenuList";
import Search from "./layouts/Search";
import ProductDetail from "./layouts/ProductDetail";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ModalProvider } from "./contexts/ModalContext";
import ModalManager from "./components/Modal/ModalManager";
import { useState, useCallback, useEffect } from "react";
import { clearAppData } from "./utils/clearAppData";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeColorProvider } from "./contexts/ThemeColorContext";
import CustomerSavings from "./layouts/CustomerSavings";
import OutletDetails from "./layouts/OutletDetails";
import OutletNotFound from "./components/OutletNotFound";
import FeedbackButton from "./components/FeedbackButton";
import axios from "axios";
import { CacheDataProvider } from "./contexts/CacheDataContext";
import CacheStatus from "./components/CacheStatus";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/react-query/queryClient';
import QueryTestWrapper from "./components/QueryTestWrapper";
// Import Toast components
import { ToastProvider } from './components/Toast/ToastContext.jsx';
import ToastContainer from './components/Toast/ToastContainer.jsx';


function App() {
  const [shouldClearCart, setShouldClearCart] = useState(false);

  const handleLogout = useCallback(() => {
    setShouldClearCart(true);
  }, []);

  

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider config={{
        position: 'bottom-center',
        duration: 3000,
        pauseOnHover: true,
        limit: 3
      }}>
        <ModalProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <CacheDataProvider>
              <OutletProvider>
                <ThemeColorProvider>
                  <ThemeProvider>
                    <AuthProvider>
                      <CartProvider onLogout={handleLogout}>
                        <AuthOffcanvas />
                        <SidebarProvider>
                          <Routes>
                            <Route path="*" element={<Home />} />
                            <Route path="/all-outlets" element={<AllOutlets />} />
                            
                            <Route path="/favourites" element={<Favourite />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route
                              path="/order-detail/:orderId"
                              element={<OrderDetail />}
                            />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/edit-profile" element={<EditProfile />} />
                            <Route path="/categories" element={<Categories />} />
                            <Route
                              path="/category-menu/:categoryId"
                              element={<CategoryFilteredMenuList />}
                            />
                            <Route path="/search" element={<Search />} />
                            <Route
                              path="/product-detail/:menuId/:menuCatId"
                              element={<ProductDetail />}
                            />
                            <Route path="/savings" element={<CustomerSavings />} />
                            <Route
                              path="/outlet-details"
                              element={<OutletDetails />}
                            />
                            <Route path="/notfound" element={<OutletNotFound />} />
                            <Route path="/query-test" element={<QueryTestWrapper />} />
                          </Routes>
                          <Sidebar />
                        </SidebarProvider>
                        <ModalManager />
                        {/* <CacheStatus /> */}
                      </CartProvider>
                    </AuthProvider>
                  </ThemeProvider>
                </ThemeColorProvider>
              </OutletProvider>
            </CacheDataProvider>
          </Router>
        </ModalProvider>
        <ToastContainer />
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </ToastProvider>
    </QueryClientProvider>
  );
}

// Add an event listener for storage changes
window.addEventListener("storage", (e) => {
  if (e.key === "auth" && !e.newValue) {
    clearAppData();
  }
  
});

export default App;

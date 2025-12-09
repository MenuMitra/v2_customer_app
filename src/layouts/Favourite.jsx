import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HorizontalMenuCard from "../components/HorizontalMenuCard";
import AuthPrompt from "../components/Auth/AuthPrompt";
import { useAuth } from "../contexts/AuthContext";
import { useOutlet } from "../contexts/OutletContext";
import apiService from "../api/apiService";

// Extracted authenticated content component
function FavouriteContent() {
  const [expandedOutlet, setExpandedOutlet] = useState({});
  const { getUserId } = useAuth();
  const { outletId } = useOutlet();
  const queryClient = useQueryClient();
  const userId = getUserId();

  // Update the query to transform the data properly
  const { data: favoriteMenus = [], isLoading } = useQuery({
    queryKey: ['favorites', outletId, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await apiService.favorites.getList({ 
        outletId, 
        userId 
      });

      // Transform the response into the format we need
      const allMenus = [];
      if (response) {
        // response is an object with outlet names as keys
        Object.entries(response).forEach(([outletName, menus]) => {
          if (Array.isArray(menus)) {
            menus.forEach((menu) => {
              allMenus.push({
                ...menu,
                outlet_name: outletName,
              });
            });
          }
        });
      }
      return allMenus;
    },
    enabled: !!userId && !!outletId,
  });

  const removeFavorite = useMutation({
    mutationFn: async ({ menuId, outletId: targetOutletId }) => {
      try {
        // Simple flag in closure to prevent duplicate calls
        if (removeFavorite.mutationFn.isRunning) {
          return null;
        }
        removeFavorite.mutationFn.isRunning = true;

        const result = await apiService.favorites.remove({ outletId: targetOutletId ?? outletId, userId, menuId });
        return result;
      } finally {
        removeFavorite.mutationFn.isRunning = false;
      }
    },
    onMutate: async ({ menuId }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', outletId, userId] });
      const previousFavorites = queryClient.getQueryData(['favorites', outletId, userId]);
      
      // Optimistically update
      queryClient.setQueryData(['favorites', outletId, userId], old => 
        old?.filter(menu => menu.menu_id !== menuId) || []
      );
      
      return { previousFavorites };
    }
  });

  const handleFavoriteUpdate = async (menuId, isFavorite, menuOutletId) => {
    if (!isFavorite && !removeFavorite.isLoading) {
      const currentFavorites = queryClient.getQueryData(['favorites', outletId, userId]);
      const menuExists = currentFavorites?.some(menu => menu.menu_id === menuId);
      
      if (menuExists) {
        await removeFavorite.mutateAsync({ menuId, outletId: menuOutletId });
      }
    }
  };

  const groupByOutlet = (menus) => {
    // Add safety check for menus array
    if (!Array.isArray(menus)) return {};
    
    return menus.reduce((acc, menu) => {
      if (!acc[menu.outlet_name]) {
        acc[menu.outlet_name] = [];
      }
      acc[menu.outlet_name].push(menu);
      return acc;
    }, {});
  };

  // Removed unused navigateToLogin

  // Move useEffect to component top level
  useEffect(() => {
    if (!isLoading && favoriteMenus.length > 0) {
      const grouped = groupByOutlet(favoriteMenus);
      const sortedEntries = Object.entries(grouped)
        .filter(([outletName]) => outletName && outletName !== "undefined")
        .sort(([, aMenus], [, bMenus]) => {
          const aOutletId = aMenus[0]?.outlet_id;
          const bOutletId = bMenus[0]?.outlet_id;
          
          if (Number(aOutletId) === Number(outletId)) return -1;
          if (Number(bOutletId) === Number(outletId)) return 1;
          
          return aMenus[0]?.outlet_name.localeCompare(bMenus[0]?.outlet_name);
        });

      if (sortedEntries.length > 0) {
        const [firstOutletName] = sortedEntries[0];
        setExpandedOutlet(prev => ({
          ...prev,
          [firstOutletName]: true
        }));
      }
    }
  }, [isLoading, favoriteMenus, outletId]); // Add proper dependencies

  const groupedMenus = groupByOutlet(favoriteMenus);

  return (
    <div className="page-content">
      <div className="content-inner pt-0">
        <div className="container mx-auto px-4 pb-5">
          <div className="dashboard-area">
            {isLoading ? (
              <div className="text-center p-5">Loading...</div>
            ) : (
              (() => {
                const entries = Object.entries(groupedMenus)
                  .filter(([outletName]) => outletName && outletName !== "undefined")
                  .sort(([, aMenus], [, bMenus]) => {
                    const aOutletId = aMenus[0]?.outlet_id;
                    const bOutletId = bMenus[0]?.outlet_id;
                    
                    if (Number(aOutletId) === Number(outletId)) return -1;
                    if (Number(bOutletId) === Number(outletId)) return 1;
                    
                    return aMenus[0]?.outlet_name.localeCompare(bMenus[0]?.outlet_name);
                  });

                return entries.length > 0 ? (
                  entries.map(([outletName, menus]) => (
                    <div key={outletName} className="mb-4">
                      <div
                        className="font-bold uppercase mb-2 flex items-center justify-between text-base cursor-pointer"
                        onClick={() =>
                          setExpandedOutlet((prev) => ({
                            ...prev,
                            [outletName]: !prev[outletName],
                          }))
                        }
                      >
                        <span>
                          <i className="fa-solid fa-store mr-2"></i>
                          {outletName}
                        </span>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
                          <i
                            className={`fa-solid fa-chevron-${
                              expandedOutlet[outletName] ? "up" : "down"
                            } text-lg text-gray-600`}
                          ></i>
                        </span>
                      </div>
                      {expandedOutlet[outletName] && (
                        <div className="mt-2">
                          {menus.map((menu) => (
                            <div className="mb-2" key={menu.menu_id}>
                              <HorizontalMenuCard
                                image={menu.image && Array.isArray(menu.image) && menu.image.length > 0 ? menu.image[0].image : null}
                                title={menu.menu_name}
                                currentPrice={menu.portions?.[0]?.price || 0}
                                reviewCount={menu.rating ? parseFloat(menu.rating) : null}
                                isFavorite={true}
                                discount={menu.offer > 0 ? `${menu.offer}%` : null}
                                menuItem={{
                                  menuId: menu.menu_id,
                                  menuCatId: menu.menu_cat_id,
                                  menuName: menu.menu_name,
                                  menuFoodType: menu.menu_food_type,
                                  categoryName: menu.category_name,
                                  spicyIndex: menu.spicy_index,
                                  portions: menu.portions,
                                  rating: menu.rating,
                                  offer: menu.offer,
                                  isSpecial: menu.is_special,
                                  isFavourite: true,
                                  isActive: true,
                                  image: menu.image && Array.isArray(menu.image) && menu.image.length > 0 
                                    ? menu.image[0].image 
                                    : null,
                                  outletName: menu.outlet_name,
                                  outletId: menu.outlet_id,
                                }}
                                onFavoriteUpdate={handleFavoriteUpdate}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center p-5">
                    <p className="text-gray-500">No favorite items found</p>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Favourite() {
  const { getUserId } = useAuth();
  const userId = getUserId();

  return (
    <>
      <Header />
      {!userId ? (
        <AuthPrompt variant="favourites" />
      ) : (
        <FavouriteContent />
      )}
      <Footer />
    </>
  );
}

export default Favourite;

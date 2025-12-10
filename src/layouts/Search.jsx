import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HorizontalMenuCard from "../components/HorizontalMenuCard";
import { useAuth } from "../contexts/AuthContext";
import { debounce } from "lodash";
import { useOutlet } from "../contexts/OutletContext";
import QuickFilters from "../components/QuickFilters";
import apiService from "../api/apiService";
import { useQuery } from "@tanstack/react-query";
import AuthPrompt from "../components/Auth/AuthPrompt";

function Search() {

  const [error, setError] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]); // Keep this state

  const searchInputRef = useRef(null);

  // Get these from context/props
  const { userId } = useAuth(); // Get user_id from auth context

  // Get cart context

  const { outletId } = useOutlet();


  // Tanstack Query: only run when refetch() is called
  const {
    data: searchData,
    isLoading,
    error: searchError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["searchMenus", outletId, userId, searchInputValue.trim()],
    queryFn: () =>
      apiService.menus.searchMenus({
        outletId,
        userId, // Make sure userId is passed
        keyword: searchInputValue.trim(),
      }),
    enabled: false,
    keepPreviousData: true,
  });

  // Update searchResults when searchData changes
  useEffect(() => {
    if (searchData?.detail?.menu_list) {
      setSearchResults(searchData.detail.menu_list);
    }
  }, [searchData]);

  // Only trigger search on Enter or search icon
  const handleSearch = async () => {
    setHasSearched(true);
    setError(null);
    // Only search if input is 3 or more characters
    if (searchInputValue.trim().length < 3) return;
    const { error: queryError } = await refetch();
    if (queryError) setError(queryError);
  };

  // Debounced version of handleSearch
  const debouncedHandleSearch = debounce(() => {
    handleSearch();
  }, 400);

  // Input change handler: fire immediately on 3rd char, debounce for 4+
  const handleSearchChange = (event) => {
    setSearchInputValue(event.target.value);
    const trimmed = event.target.value.trim();
    if (!trimmed) {
      setHasSearched(false); // Reset search state if input is cleared
    }
    const len = trimmed.length;
    if (len === 3) {
      handleSearch();
    } else if (len > 3) {
      debouncedHandleSearch();
    }
  };

  // Optimistically update favourite icon for a menu in local search results
  const handleFavoriteUpdate = (menuId, nextIsFavorite) => {
    setSearchResults((prev) =>
      Array.isArray(prev)
        ? prev.map((item) =>
            item?.menu_id === menuId
              ? { ...item, is_favourite: nextIsFavorite ? 1 : 0 }
              : item
          )
        : prev
    );
  };

  // Handle quick filter changes
  const handleQuickFilterChange = (filtered) => {
    setSearchResults(filtered);
  };

  // Focus the search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Use searchResults for display
  const displayResults = searchResults;

  return (
    <>
      <style>{`
        /* Remove the clear (x) button from search inputs */
        input[type="search"]::-webkit-search-decoration,
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-results-button,
        input[type="search"]::-webkit-search-results-decoration,
        input[type="search"]::-webkit-clear-button {
          -webkit-appearance: none;
          appearance: none;
          display: none;
        }
        
        input[type="search"]::-ms-clear,
        input[type="search"]::-ms-reveal {
          display: none;
          width: 0;
          height: 0;
        }

        input[type="search"] {
          -moz-appearance: none;
          appearance: none;
        }

        /* Search field highlighting */
        .search-container:focus-within {
          border-color: #66ccd4 !important;
        }
      `}</style>
      <Header />
      <div className="page-content">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="relative z-[1]">
            <div className="flex items-center mb-4">
              <div className="w-full">
                <div className="search-container mb-0 flex items-center border-2 border-gray-300 rounded-lg overflow-hidden transition-colors duration-200">
                  <div className="flex items-center justify-center px-3 bg-[#f8f9fa] cursor-not-allowed opacity-50">
                    <i className="fas fa-search text-[20px] text-[#7D8FAB]"></i>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="flex-1 px-3 py-2 border-0 outline-none"
                    placeholder="Search menu items..."
                    onChange={handleSearchChange}
                    value={searchInputValue}
                    autoComplete="off"
                    results="0"
                    data-search-input
                  />
                  {searchInputValue && (
                    <div className="flex items-center px-4">
                      <button
                        type="button"
                        className="p-0 border-0 bg-transparent text-[#6c757d] text-base leading-none cursor-pointer hover:text-[#495057] transition-colors"
                        onClick={() => {
                          setSearchInputValue("");
                          setSearchResults([]);
                          if (searchInputRef.current) {
                            searchInputRef.current.focus();
                          }
                        }}
                        title="Clear search"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <QuickFilters
              onFilterChange={handleQuickFilterChange}
              menuList={searchResults}
            />

            {isLoading || isFetching ? (
              <div className="text-center py-4">
                <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : (error || searchError) &&
              searchError?.response?.status !== 404 ? (
              <div className="text-center py-4">
                <div className="empty-search-state">
                  <i className="fas fa-exclamation-circle text-[64px] text-[#dc3545] opacity-50 mb-4"></i>
                  <p className="mt-3 text-[#6c757d]">
                    Error:{" "}
                    {error?.message ||
                      searchError?.message ||
                      "Failed to fetch"}
                  </p>
                </div>
              </div>
            ) : !hasSearched || searchInputValue.trim() === "" ? (
              <AuthPrompt
                iconClassName="fa-solid fa-magnifying-glass"
                title="Search Menu"
                subtitle="Type 3 or more characters to search"
                buttonLabel="Start Searching"
                onLogin={() => {
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                containerClassName="w-full"
                minHeight="calc(100vh - 300px)"
              />
            ) : displayResults.length === 0 ||
              searchError?.response?.status === 404 ? (
              <AuthPrompt
                iconClassName="fa-solid fa-magnifying-glass"
                title="No menu found"
                subtitle="Try different keywords or filters"
                buttonLabel="Clear Search"
                onLogin={() => {
                  setSearchInputValue("");
                  setSearchResults([]);
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                containerClassName="w-full"
                minHeight="calc(100vh - 300px)"
              />
            ) : (
              <div className="item-list style-2">
                <div className="saprater" />
                <ul>
                  {displayResults.map((menu) => (
                    <li key={menu.menu_id}>
                      <HorizontalMenuCard
                        image={
                          menu.images &&
                          Array.isArray(menu.images) &&
                          menu.images.length > 0
                            ? menu.images[0].image
                            : menu.image || null
                        }
                        title={menu.menu_name}
                        currentPrice={
                          menu.offer > 0
                            ? Math.round(
                                menu.portions?.[0]?.price *
                                  (1 - menu.offer / 100)
                              )
                            : menu.portions?.[0]?.price || 0
                        }
                        originalPrice={
                          menu.offer > 0 ? menu.portions?.[0]?.price : null
                        }
                        discount={menu.offer > 0 ? `${menu.offer}%` : null}
                        menuItem={{
                          menuId: menu.menu_id,
                          menuCatId: menu.menu_cat_id,
                          menuName: menu.menu_name,
                          portions:
                            menu.portions?.map((portion) => ({
                              portion_id: portion.portion_id,
                              portion_name: portion.portion_name,
                              price: portion.price,
                              unit_value: portion.unit_value,
                              unit_type: portion.unit_type,
                            })) || [],
                          image:
                            menu.images &&
                            Array.isArray(menu.images) &&
                            menu.images.length > 0
                              ? menu.images[0].image
                              : menu.image || null,
                          menuFoodType: menu.menu_food_type,
                          category: menu.category_name,
                          rating: menu.rating,
                          isSpecial: menu.is_special,
                          spicyIndex: menu.spicy_index, // Add this line
                          categoryName: menu.category_name, // Add this line
                        }}
                        onFavoriteUpdate={handleFavoriteUpdate}
                        isFavorite={menu.is_favourite === 1}
                        rating={menu.rating}
                        categoryName={menu.category_name}
                        spicyIndex={menu.spicy_index}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Search;

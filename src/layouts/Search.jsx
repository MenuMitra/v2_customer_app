import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HorizontalMenuCard from "../components/HorizontalMenuCard";
import { useAuth } from "../contexts/AuthContext"; // Assuming you have AuthContext
import { debounce } from "lodash"; // Make sure to install lodash
import { useOutlet } from "../contexts/OutletContext";
import QuickFilters from "../components/QuickFilters";
import apiService from "../api/apiService";
import { useQuery } from "@tanstack/react-query";
import AuthPrompt from "../components/Auth/AuthPrompt";

function Search() {
  // Add this at the start of the component, with other useEffects
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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
    // Only search if input is 4 or more characters
    if (searchInputValue.trim().length < 4) return;
    const { error: queryError } = await refetch();
    if (queryError) setError(queryError);
  };

  // Debounced version of handleSearch
  const debouncedHandleSearch = debounce(() => {
    handleSearch();
  }, 400);

  // Input change handler (triggers search if 4+ chars)
  const handleSearchChange = (event) => {
    setSearchInputValue(event.target.value);
    if (!event.target.value.trim()) {
      setHasSearched(false); // Reset search state if input is cleared
    }
    if (event.target.value.trim().length >= 4) {
      debouncedHandleSearch();
    }
  };

  const handleFavoriteClick = async (menuId, isFavorite) => {
    if (!userId) {
      // setShowAuthOffcanvas(true); // This state is not defined in the original file
      return;
    }

    try {
      if (isFavorite) {
        await apiService.favorites.remove({ outletId, userId, menuId });
      } else {
        await apiService.favorites.add({ outletId, userId, menuId });
      }
      // Refetch search results to get updated is_favourite status
      refetch();
    } catch (error) {
      console.error("Failed to update favorite status:", error);
    }
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
      <Header />
      <div className="page-content">
        <div className="container">
          <div className="serach-area">
            <div className="d-flex align-items-center mb-4">
              <div className="w-100">
                <div className="mb-0 input-group input-group-icon">
                  <div className="input-group-text">
                    <div
                      className="input-icon search-icon"
                      style={{ cursor: "not-allowed", opacity: 0.5 }}
                    >
                      <i
                        className="fas fa-search"
                        style={{ fontSize: "20px", color: "#7D8FAB" }}
                      ></i>
                    </div>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="form-control main-in px-0 bs-0"
                    placeholder="Search menu items..."
                    onChange={handleSearchChange}
                    value={searchInputValue}
                    autoComplete="off"
                    results="0"
                    data-search-input
                  />
                  {searchInputValue && (
                    <div className="input-group-text px-4">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0"
                        onClick={() => {
                          setSearchInputValue("");
                          setSearchResults([]);
                          if (searchInputRef.current) {
                            searchInputRef.current.focus();
                          }
                        }}
                        style={{
                          color: "#6c757d",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: "0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
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
              menuList={searchResults} // Pass the original search results
            />

            {isLoading || isFetching ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (error || searchError) &&
              searchError?.response?.status !== 404 ? (
              <div className="text-center py-4">
                <div className="empty-search-state">
                  <i
                    className="fas fa-exclamation-circle"
                    style={{
                      fontSize: "64px",
                      color: "#dc3545",
                      opacity: "0.5",
                      marginBottom: "1rem",
                    }}
                  ></i>
                  <p className="mt-3 text-muted">
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
                subtitle="Type 4 or more characters to search"
                buttonLabel="Start Searching"
                onLogin={() => {
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                containerClassName="w-100"
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
                containerClassName="w-100"
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
                        onFavoriteClick={() =>
                          handleFavoriteClick(
                            menu.menu_id,
                            menu.is_favourite === 1
                          )
                        }
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

const styles = `
  .input-icon.search-icon.disabled {
    pointer-events: none;
  }
  
  .empty-search-state {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 10rem;
  }
  
  .empty-search-state i {
    margin-bottom: 1rem;
  }
  
  .empty-search-state p {
    font-size: 1rem;
    color: #6c757d;
    margin: 0;
    max-width: 80%;
    text-align: center;
  }
  
  .recent-search-list i {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Remove the clear (x) button from search inputs - Comprehensive solution */
  input[type="search"]::-webkit-search-decoration,
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-results-button,
  input[type="search"]::-webkit-search-results-decoration,
  input[type="search"]::-webkit-clear-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }
  
  /* For Edge/IE */
  input[type="search"]::-ms-clear,
  input[type="search"]::-ms-reveal {
    display: none;
    width: 0;
    height: 0;
  }

  /* For Firefox */
  input[type="search"] {
    -moz-appearance: none;
  }

  /* Global override */
  input[type="search"] {
    appearance: none;
  }

  /* Additional safety measure */
  .main-in::-webkit-search-cancel-button {
    display: none !important;
    -webkit-appearance: none !important;
  }

  /* QuickFilters styles */
  .basic-dropdown {
    position: relative;
    z-index: 1050; /* Higher z-index to ensure visibility */
  }

  .basic-dropdown .dropdown-menu {
    z-index: 1051; /* Even higher z-index for the dropdown menu */
  }

  .basic-dropdown .dropdown-menu.show {
    display: block;
    margin-top: 5px;
  }

  /* Ensure the search container doesn't overlap */
  .serach-area {
    position: relative;
    z-index: 1;
  }
`;

export default Search;

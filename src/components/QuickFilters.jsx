import { useState, useRef, useEffect } from "react";

const QuickFilters = ({ onFilterChange, menuList }) => {
  const [activeFilters, setActiveFilters] = useState({
    type: null,
    price: null,
    spicy: null,
  });

  // Add this effect to handle initial filtering
  useEffect(() => {
    if (menuList && menuList.length > 0) {
      filterMenus(activeFilters);
    }
  }, [menuList]); // Re-run when menuList changes

  // Separate the filtering logic into its own function
  const filterMenus = (filters) => {
    if (!menuList) return [];
    
    let filtered = [...menuList];

    // Type filter - check menu_food_type
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter(
        (menu) => menu.menu_food_type.toLowerCase() === filters.type.toLowerCase()
      );
    }

    // Price filter - use first portion's price
    if (filters.price && filters.price !== "all") {
      filtered = filtered.filter((menu) => {
        // Get the first portion's price
        const price = menu.portions[0]?.price || 0;
        
        switch (filters.price) {
          case "50":
            return price <= 50;
          case "100":
            return price <= 100;
          case "200":
            return price <= 200;
          case "500":
            return price <= 500;
          case "1000":
            return price <= 1000;
          case "above1000":
            return price > 1000;
          default:
            return true;
        }
      });
    }

    // Spicy filter - check spicy_index
    if (filters.spicy && filters.spicy !== "all") {
      filtered = filtered.filter((menu) => {
        switch (filters.spicy) {
          case "low":
            return menu.spicy_index === "1";
          case "medium":
            return menu.spicy_index === "2";
          case "high":
            return menu.spicy_index === "3";
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Add state to track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState(null);

  // Add refs for each dropdown
  const dropdownRefs = {
    type: useRef(),
    price: useRef(),
    spicy: useRef(),
  };

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".dropdown")) {
        setOpenDropdown(null);
      }
    };


    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdown]);

  // Add getFoodTypeStyles function
  const getFoodTypeStyles = (foodType) => {
    // Convert foodType to lowercase for case-insensitive comparison
    const type = (foodType || "").toLowerCase();

    switch (type) {
      case "veg":
        return {
          icon: <i className="fa-solid fa-circle text-green-600" />,
          border: "border-green-600",
          textColor: "text-green-600",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-green-600 mr-1" />
          ),
        };
      case "nonveg":
        return {
          icon: (
            <i className="fa-solid fa-play fa-rotate-270 text-[#FF2D2D]" />
          ),
          border: "border-red-600",
          textColor: "text-red-600",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-[#FF2D2D]" />
          ),
        };
      case "egg":
        return {
          icon: <i className="fa-solid fa-egg text-gray-500" />,
          border: "text-gray-500",
          categoryIcon: <i className="fa-solid fa-utensils mr-1" />,
        };
      case "vegan":
        return {
          icon: <i className="fa-solid fa-leaf text-green-600" />,
          border: "border-green-600",
          textColor: "text-green-600",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-green-600 mr-1" />
          ),
        };
      default:
        return {
          icon: <i className="fa-solid fa-circle text-green-600" />,
          border: "border-green-600",
          textColor: "text-green-600",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-green-600 mr-1" />
          ),
        };
    }
  };

  // Replace static typeOptions with dynamic icons using getFoodTypeStyles
  const typeOptions = [
    {
      id: "all",
      label: "All",
      icon: <i className="fa-solid fa-utensils text-green-600" />,
    },
    { id: "veg", label: "Veg", icon: getFoodTypeStyles("veg").icon },
    { id: "nonveg", label: "Nonveg", icon: getFoodTypeStyles("nonveg").icon },
    { id: "vegan", label: "Vegan", icon: getFoodTypeStyles("vegan").icon },
    { id: "egg", label: "Egg", icon: getFoodTypeStyles("egg").icon },
  ];

  const priceOptions = [
    { id: "all", label: "All", buttonLabel: "All" },
    { id: "50", label: "Under ₹50", buttonLabel: "₹50", icon: "₹" },
    { id: "100", label: "Under ₹100", buttonLabel: "₹100", icon: "₹" },
    { id: "200", label: "Under ₹200", buttonLabel: "₹200", icon: "₹" },
    { id: "500", label: "Under ₹500", buttonLabel: "₹500", icon: "₹" },
    { id: "1000", label: "Under ₹1000", buttonLabel: "₹1000", icon: "₹" },
    { id: "above1000", label: "Above ₹1000", buttonLabel: "₹1000+", icon: "₹" },
  ];

  const spicyOptions = [
    {
      id: "all",
      label: "All",
      icon: (
        <span className="relative inline-block w-6 h-5">
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="align-middle"
          >
            <path
              d="M2 3.5C2 2.11929 3.11929 1 4.5 1H17.5C18.8807 1 20 2.11929 20 3.5C20 4.09544 19.7625 4.66812 19.3416 5.08902L13.5 10.9306V17C13.5 17.5523 13.0523 18 12.5 18H9.5C8.94772 18 8.5 17.5523 8.5 17V10.9306L2.65837 5.08902C2.23747 4.66812 2 4.09544 2 3.5Z"
              fill="#22A45D"
            />
          </svg>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -right-0.5 -bottom-0.5"
          >
            <circle cx="6.5" cy="6.5" r="6.5" fill="#22A45D" />
            <path
              d="M4.8 4.8L8.2 8.2M8.2 4.8L4.8 8.2"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ),
    },
    {
      id: "low",
      label: "Low",
      icon: (
        <i className="fa-solid fa-pepper-hot text-[#22A45D] text-[18px]"></i>
      ),
    },
    {
      id: "medium",
      label: "Medium",
      icon: (
        <i className="fa-solid fa-pepper-hot text-[#FFA500] text-[18px]"></i>
      ),
    },
    {
      id: "high",
      label: "High",
      icon: (
        <i className="fa-solid fa-pepper-hot text-[#FF2D2D] text-[18px]"></i>
      ),
    },
  ];

  // Modify handleFilterClick to use the new filtering function
  const handleFilterClick = (filterType, value) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: activeFilters[filterType] === value ? null : value,
    };
    setActiveFilters(newFilters);

    // Apply filters and send results back to parent
    const filteredResults = filterMenus(newFilters);
    onFilterChange(filteredResults);
  };

  const getButtonIcon = (type) => {
    switch (type.toLowerCase()) {
      case "type":
        return (
          <i className="fa-solid fa-filter text-[#22A45D] text-[18px] mr-1.5"></i>
        );
      case "price":
        return (
          <i className="fa-solid fa-indian-rupee-sign text-[#22A45D] text-[18px] mr-1.5"></i>
        );
      case "spicy":
        return (
          <i className="fa-solid fa-pepper-hot text-[#22A45D] text-[18px] mr-1.5"></i>
        );
      default:
        return null;
    }
  };

  // Modify the getButtonLabel function
  const getButtonLabel = (type, options, activeValue) => {
    if (!activeValue || activeValue === "all") {
      const allOption = options.find(opt => opt.id === "all");
      return allOption?.label || type;
    }
    const selectedOption = options.find((opt) => opt.id === activeValue);
    return selectedOption?.buttonLabel || selectedOption?.label || type;
  };

  const handleDropdownToggle = (dropdownName, isOpen) => {
    if (isOpen) {
      setOpenDropdown(dropdownName);
    } else {
      setOpenDropdown(null);
    }
  };

  const renderFilterDropdown = (type, options, activeValue) => {
    const dropdownType = type.toLowerCase();
    const isActive = activeValue && activeValue !== "all";

    return (
      <div
        className="bg-transparent"
        ref={dropdownRefs[dropdownType]}
      >
        <div className="p-0">
          <div className="relative dropdown">
            <button
              type="button"
              className={`rounded-full flex items-center gap-2 px-3 py-2 w-[120px] transition-all duration-200 text-sm font-medium ${
                isActive
                  ? "bg-[#F7FBF9] border-[1.5px] border-[#22A45D] shadow-[0_2px_8px_rgba(34,164,93,0.12)]"
                  : "bg-white border-[1.5px] border-[#eaeaea] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              }`}
              aria-expanded={openDropdown === dropdownType}
              onClick={(e) => {
                e.preventDefault();
                handleDropdownToggle(dropdownType, openDropdown !== dropdownType);
              }}
            >
              {getButtonIcon(type)}
              <span className={`overflow-hidden text-ellipsis whitespace-nowrap inline-block max-w-[72px] ${
                isActive ? "text-[#22A45D]" : "text-[#555555]"
              }`}>
                {getButtonLabel(type, options, activeValue)}
              </span>
              <i 
                className={`fas fa-chevron-down ml-1 text-[10px] opacity-60 transition-transform duration-200 ${
                  openDropdown === dropdownType ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              className={`absolute z-10 bg-white border-2 border-gray-300 shadow-sm rounded-2xl mt-2 p-1.5 min-w-[160px] ${
                openDropdown === dropdownType ? "block animate-dropdown-fade" : "hidden"
              }`}
            >
              {options.map((option) => (
                <a
                  key={option.id}
                  className={`block rounded-full py-2 px-4 my-0.5 flex items-center transition-all duration-150 cursor-pointer hover:bg-gray-100 hover:text-[#22A45D] ${
                    activeValue === option.id 
                      ? "text-[#22A45D] bg-[#F0F9F4]" 
                      : "text-[#555555] bg-transparent"
                  }`}
                  href="javascript:void(0);"
                  onClick={() => {
                    handleFilterClick(dropdownType, option.id);
                    setOpenDropdown(null);
                  }}
                >
                  <span className="mr-2 opacity-90">{option.icon}</span>
                  <span className={activeValue === option.id ? "font-medium" : "font-normal"}>
                    {option.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-dropdown-fade {
          animation: dropdownFade 0.2s ease;
        }
      `}</style>
      <div className="flex gap-2 flex-wrap">
        {renderFilterDropdown("Type", typeOptions, activeFilters.type)}
        {renderFilterDropdown("Price", priceOptions, activeFilters.price)}
        {renderFilterDropdown("Spicy", spicyOptions, activeFilters.spicy)}
      </div>
    </>
  );
};

export default QuickFilters;

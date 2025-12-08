import React, { useState, useRef, useEffect } from "react";

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
          icon: <i className="fa-solid fa-circle text-success" />, // green dot
          border: "border-success",
          textColor: "text-success",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-success me-1" />
          ),
        };
      case "nonveg":
        return {
          icon: (
            <i
              className="fa-solid fa-play fa-rotate-270"
              style={{ color: "#FF2D2D" }}
            />
          ), // red triangle with custom color
          border: "border-danger",
          textColor: "text-danger",
          categoryIcon: (
            <i className="fa-solid fa-utensils" style={{ color: "#FF2D2D" }} />
          ),
        };
      case "egg":
        return {
          icon: <i className="fa-solid fa-egg gray-text" />, // egg icon
          border: "gray-text",
          // textColor: "gray-text",
          categoryIcon: <i className="fa-solid fa-utensils me-1" />,
        };
      case "vegan":
        return {
          icon: <i className="fa-solid fa-leaf text-success" />, // leaf icon
          border: "border-success",
          textColor: "text-success",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-success me-1" />
          ),
        };
      default:
        return {
          icon: <i className="fa-solid fa-circle text-success" />, // default green dot
          border: "border-success",
          textColor: "text-success",
          categoryIcon: (
            <i className="fa-solid fa-utensils text-success me-1" />
          ),
        };
    }
  };

  // Replace static typeOptions with dynamic icons using getFoodTypeStyles
  const typeOptions = [
    {
      id: "all",
      label: "All",
      icon: <i className="fa-solid fa-utensils text-success" />,
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
        <span
          style={{
            position: "relative",
            display: "inline-block",
            width: 24,
            height: 20,
          }}
        >
          {/* Green filter icon */}
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ verticalAlign: "middle" }}
          >
            <path
              d="M2 3.5C2 2.11929 3.11929 1 4.5 1H17.5C18.8807 1 20 2.11929 20 3.5C20 4.09544 19.7625 4.66812 19.3416 5.08902L13.5 10.9306V17C13.5 17.5523 13.0523 18 12.5 18H9.5C8.94772 18 8.5 17.5523 8.5 17V10.9306L2.65837 5.08902C2.23747 4.66812 2 4.09544 2 3.5Z"
              fill="#22A45D"
            />
          </svg>
          {/* White X in green circle at bottom right */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", right: -2, bottom: -2 }}
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
        <i
          className="fa-solid fa-pepper-hot"
          style={{ color: "#22A45D", fontSize: 18 }}
        ></i>
      ),
    },
    {
      id: "medium",
      label: "Medium",
      icon: (
        <i
          className="fa-solid fa-pepper-hot"
          style={{ color: "#FFA500", fontSize: 18 }}
        ></i>
      ),
    },
    {
      id: "high",
      label: "High",
      icon: (
        <i
          className="fa-solid fa-pepper-hot"
          style={{ color: "#FF2D2D", fontSize: 18 }}
        ></i>
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
          <i
            className="fa-solid fa-filter"
            style={{ color: "#22A45D", fontSize: 18, marginRight: 6 }}
          ></i>
        );
      case "price":
        return (
          <i
            className="fa-solid fa-indian-rupee-sign"
            style={{ color: "#22A45D", fontSize: 18, marginRight: 6 }}
          ></i>
        );
      case "spicy":
        return (
          <i
            className="fa-solid fa-pepper-hot"
            style={{ color: "#22A45D", fontSize: 18, marginRight: 6 }}
          ></i>
        );
      default:
        return null;
    }
  };

  // Modify the getButtonLabel function
  const getButtonLabel = (type, options, activeValue) => {
    if (!activeValue || activeValue === "all") {
      // Return "All" instead of the type name when "all" is selected
      const allOption = options.find(opt => opt.id === "all");
      return allOption?.label || type;
    }
    const selectedOption = options.find((opt) => opt.id === activeValue);
    // Use buttonLabel if available, otherwise fall back to label
    return selectedOption?.buttonLabel || selectedOption?.label || type;
  };

  const handleDropdownToggle = (dropdownName, isOpen) => {
    if (isOpen) {
      // Close other dropdowns
      Object.keys(dropdownRefs).forEach((key) => {
        if (key !== dropdownName && dropdownRefs[key].current) {
          const dropdown =
            dropdownRefs[key].current.querySelector(".dropdown-menu");
          if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
          }
        }
      });
      setOpenDropdown(dropdownName);
    } else {
      setOpenDropdown(null);
    }
  };

  const renderFilterDropdown = (type, options, activeValue) => {
    const dropdownType = type.toLowerCase();

    return (
      <div
        className="card border-0 bg-transparent"
        ref={dropdownRefs[dropdownType]}
      >
        <div className="card-body p-0">
          <div className="basic-dropdown">
            <div className="dropdown">
              <button
                type="button"
                className={`btn rounded-3xl d-flex align-items-center gap-2 px-3 py-2 ${
                  activeValue && activeValue !== "all"
                    ? "filter-active"
                    : "filter-default"
                }`}
                style={{
                  border: activeValue && activeValue !== "all"
                    ? "1.5px solid #22A45D"
                    : "1.5px solid #eaeaea",
                  width: "120px", // fixed size to avoid overlap
                  transition: "all 0.2s ease",
                  fontSize: "14px",
                  fontWeight: "500",
                  boxShadow: activeValue && activeValue !== "all"
                    ? "0 2px 8px rgba(34, 164, 93, 0.12)"
                    : "0 1px 2px rgba(0, 0, 0, 0.04)",
                }}
                data-bs-toggle="dropdown"
                aria-expanded={openDropdown === dropdownType}
                onClick={(e) => {
                  e.preventDefault();
                  handleDropdownToggle(dropdownType, openDropdown !== dropdownType);
                }}
              >
                {getButtonIcon(type)}
                <span style={{
                  color: activeValue && activeValue !== "all"
                    ? "#22A45D"
                    : "#555555",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  maxWidth: "72px" // keep room for icon and chevron
                }}>
                  {getButtonLabel(type, options, activeValue)}
                </span>
                <i 
                  className="fas fa-chevron-down ms-1" 
                  style={{ 
                    fontSize: "10px",
                    opacity: 0.6,
                    transform: openDropdown === dropdownType ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s ease"
                  }}
                />
              </button>

              <div
                className={`dropdown-menu shadow-sm border-0 mt-2 ${
                  openDropdown === dropdownType ? "show" : ""
                }`}
                style={{
                  borderRadius: "16px",
                  padding: "6px",
                  minWidth: "160px",
                  animation: "dropdownFade 0.2s ease",
                }}
              >
                {options.map((option) => (
                  <a
                    key={option.id}
                    className={`dropdown-item rounded-pill ${
                      activeValue === option.id ? "active" : ""
                    }`}
                    style={{
                      padding: "8px 16px",
                      margin: "2px 0",
                      display: "flex",
                      alignItems: "center",
                      color: activeValue === option.id ? "#22A45D" : "#555555",
                      backgroundColor: activeValue === option.id ? "#F0F9F4" : "transparent",
                      transition: "all 0.15s ease",
                    }}
                    href="javascript:void(0);"
                    onClick={() => {
                      handleFilterClick(dropdownType, option.id);
                      setOpenDropdown(null); // Close dropdown after selection
                    }}
                  >
                    <span className="me-2" style={{ opacity: 0.9 }}>{option.icon}</span>
                    <span style={{ 
                      fontWeight: activeValue === option.id ? "500" : "400"
                    }}>
                      {option.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add these styles to your CSS
  const styles = `
    .filter-active {
      background-color: #F7FBF9 !important;
    }

    .filter-default {
      background-color: white !important;
    }

    .dropdown-item:hover {
      background-color: #F8F8F8 !important;
      color: #22A45D !important;
    }

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
  `;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  return (
    <div className="d-flex gap-2 flex-wrap">
      {renderFilterDropdown("Type", typeOptions, activeFilters.type)}
      {renderFilterDropdown("Price", priceOptions, activeFilters.price)}
      {renderFilterDropdown("Spicy", spicyOptions, activeFilters.spicy)}
    </div>
  );
};

export default QuickFilters;

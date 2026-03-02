import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { parseRestoUrl } from "../utils/urlParser";
import apiService from "../api/apiService";
import { useToast } from "../components/Toast/useToast";

const VegIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="14"
      height="14"
      rx="2"
      stroke="#008000"
      strokeWidth="2"
    />
    <circle cx="8" cy="8" r="4" fill="#008000" />
  </svg>
);

const NonVegIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="14"
      height="14"
      rx="2"
      stroke="#FF0000"
      strokeWidth="2"
    />
    <circle cx="8" cy="8" r="4" fill="#FF0000" />
  </svg>
);

const toTitleCase = (str) =>
  str
    ? str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    : str;

function AllOutlets() {
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    type: "all", // 'all', 'veg', 'nonveg'
    status: "all", // 'all', 'open', 'closed'
  });
  const [openDropdown, setOpenDropdown] = useState(null);

  // Replace useState and useEffect with useQuery
  const {
    data: outlets = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['outlets'],
    queryFn: apiService.customer.getAllRestaurants,
  });

  // Log closed outlets
  useEffect(() => {
    const closedOutlets = outlets.filter(outlet => !outlet.is_open);
    console.log("Closed Outlets:", closedOutlets);
  }, [outlets]);

  // Filter outlets based on current filters
  const filteredOutlets = outlets.filter(outlet => {
    if (filters.type !== "all" && outlet.veg_nonveg !== filters.type) {
      return false;
    }
    if (filters.status !== "all") {
      return filters.status === "open" ? outlet.is_open : !outlet.is_open;
    }
    return true;
  });

  // Show toasts instead of inline alerts for errors/empty results
  useEffect(() => {
    if (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message, 'Error');
      return;
    }
    if (!isLoading && Array.isArray(outlets) && outlets.length > 0 && filteredOutlets.length === 0) {
      toast.info('No restaurants found matching your filters', 'Info');
    }
  }, [error, isLoading, filteredOutlets.length, outlets, toast]);

  const handleRestoUrl = (url, isOpen, isOutletFilled) => {
    // If outlet is closed or not fully set up, don't process the click
    if (!isOpen) {
      return;
    }
    if (!isOutletFilled) {
      toast.info('This outlet is not ready yet', 'Info');
      return;
    }

    const parsed = parseRestoUrl(url);

    if (!parsed.isValid) {
      console.error("Invalid resto URL format:", url);
      return;
    }

    const { outletCode, sectionId, tableId } = parsed;
    navigate(`/o${outletCode}/s${sectionId}/t${tableId}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <>
      <Header />
      <div className="page-content">
        <div className="container mx-auto pb-20 flex flex-col items-center">
          {/* Title Section */}
          <div className="flex justify-between items-center mb-3 w-full">
            <h6 className="mb-0 font-semibold text-base">All Outlets</h6>
            <span className="text-gray-500 text-sm">{filteredOutlets.length} outlet{filteredOutlets.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Filter Section */}
          <div className="mb-3">
            <div className="flex justify-between items-center">
              {/* Restaurant Type Filter - Left Side */}
              <div className="relative dropdown-container">
                <button
                  className="px-4 py-2 border border-gray-400 text-gray-700 bg-white rounded hover:bg-gray-50 transition-colors min-w-[100px] flex items-center justify-between gap-2"
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                >
                  <span>
                    {filters.type === "all"
                      ? "All"
                      : filters.type === "veg"
                        ? "Veg"
                        : "Non-Veg"}
                  </span>
                  <i className={`fas fa-chevron-down text-xs transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`}></i>
                </button>
                <ul className={`absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-lg min-w-[100px] ${openDropdown === 'type' ? 'block' : 'hidden'}`}>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${filters.type === "all" ? "bg-green-50 text-green-600" : ""
                        }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, type: "all" }));
                        setOpenDropdown(null);
                      }}
                    >
                      All
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center ${filters.type === "veg" ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, type: "veg" }));
                        setOpenDropdown(null);
                      }}
                    >
                      <VegIcon />
                      <span className="ml-2">Veg</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center ${filters.type === "nonveg" ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, type: "nonveg" }));
                        setOpenDropdown(null);
                      }}
                    >
                      <NonVegIcon />
                      <span className="ml-2">Non-Veg</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Vertical Divider */}
              <div className="w-px h-[35px] bg-gray-300 opacity-25 mx-3"></div>

              {/* Status Filter - Right Side */}
              <div className="relative dropdown-container">
                <button
                  className="px-4 py-2 border border-gray-400 text-gray-700 bg-white rounded hover:bg-gray-50 transition-colors min-w-[100px] flex items-center justify-between gap-2"
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                >
                  <span>
                    {filters.status === "all"
                      ? "All"
                      : filters.status === "open"
                        ? "Open"
                        : "Closed"}
                  </span>
                  <i className={`fas fa-chevron-down text-xs transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`}></i>
                </button>
                <ul className={`absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-lg min-w-[100px] ${openDropdown === 'status' ? 'block' : 'hidden'}`}>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${filters.status === "all" ? "bg-green-50 text-green-600" : ""
                        }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, status: "all" }));
                        setOpenDropdown(null);
                      }}
                    >
                      All
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${filters.status === "open" ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, status: "open" }));
                        setOpenDropdown(null);
                      }}
                    >
                      Open
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${filters.status === "closed" ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, status: "closed" }));
                        setOpenDropdown(null);
                      }}
                    >
                      Closed
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Updated Results Section */}
          {isLoading ? (
            <div className="text-center py-4">Loading restaurants...</div>
          ) : filteredOutlets.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No results</div>
          ) : (
            <div className="flex flex-col gap-2 w-full max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
              {filteredOutlets.map((outlet) => (
                <div
                  key={outlet.outlet_id}
                  className={`border-0 mb-2 rounded border transition-all duration-300 ${outlet.is_open
                    ? 'cursor-pointer opacity-100 hover:-translate-y-0.5 hover:shadow-lg'
                    : 'cursor-not-allowed opacity-70'
                    } shadow-sm`}
                  onClick={() => handleRestoUrl(outlet.resto_url, outlet.is_open, outlet.is_outlet_filled)}
                >
                  <div className="p-3 rounded border">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {outlet.veg_nonveg === "veg" ? (
                          <span
                            className="flex items-center"
                            title="Veg"
                          >
                            <VegIcon />
                          </span>
                        ) : (
                          <span
                            className="flex items-center"
                            title="Non-Veg"
                          >
                            <NonVegIcon />
                          </span>
                        )}
                        <h6 className="text-base font-semibold mb-0">
                          {toTitleCase(outlet.outlet_name)}
                        </h6>
                      </div>
                      <span
                        className={`inline-block rounded-full px-3 py-2 text-xs font-medium ${outlet.is_open ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                      >
                        {outlet.is_open ? "OPEN" : "CLOSED"}
                      </span>
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center text-gray-500 text-sm mb-0">
                        <i className="fas fa-map-marker-alt text-base w-6"></i>
                        <span>{toTitleCase(outlet.address)}</span>
                      </p>
                      <p className="flex items-center text-gray-500 text-sm mb-0">
                        <i className="fas fa-phone text-base w-6"></i>
                        <span>{outlet.mobile}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AllOutlets;

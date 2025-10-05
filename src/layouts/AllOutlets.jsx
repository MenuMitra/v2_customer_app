import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { parseRestoUrl } from "../utils/urlParser";
import apiService from "../api/apiService";
import { useToast } from "../components/Toast/useToast";

const VegIcon = () => (
  <svg
    width="16"
    height="16"
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
    width="16"
    height="16"
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

function AllOutlets() {
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    type: "all", // 'all', 'veg', 'nonveg'
    status: "all", // 'all', 'open', 'closed'
  });

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

  return (
    <>
      <Header />
      <div className="page-content">
        <div
          className="container"
          style={{
            paddingBottom: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Title Section */}
          {/* <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">All Restaurants</h6>
            <span className="text-muted small">Total: {filteredOutlets.length} outlets</span>
          </div> */}

          {/* Filter Section */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              {/* Restaurant Type Filter - Left Side */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  id="vegTypeDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ minWidth: 100 }}
                >
                  {filters.type === "all"
                    ? "All"
                    : filters.type === "veg"
                    ? "Veg"
                    : "Non-Veg"}
                </button>
                <ul className="dropdown-menu" aria-labelledby="vegTypeDropdown">
                  <li>
                    <button
                      className={`dropdown-item${
                        filters.type === "all" ? " green-active" : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, type: "all" }))
                      }
                    >
                      All
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item d-flex align-items-center${
                        filters.type === "veg" ? " active" : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, type: "veg" }))
                      }
                    >
                      <VegIcon />
                      <span className="ms-2">Veg</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item d-flex align-items-center${
                        filters.type === "nonveg" ? " active" : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, type: "nonveg" }))
                      }
                    >
                      <NonVegIcon />
                      <span className="ms-2">Non-Veg</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Vertical Divider */}
              <div
                className="vr mx-3 opacity-25"
                style={{ height: "35px" }}
              ></div>

              {/* Status Filter - Right Side */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  id="statusDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ minWidth: 100 }}
                >
                  {filters.status === "all"
                    ? "All"
                    : filters.status === "open"
                    ? "Open"
                    : "Closed"}
                </button>
                <ul className="dropdown-menu" aria-labelledby="statusDropdown">
                  <li>
                    <button
                      className={`dropdown-item${
                        filters.status === "all" ? " green-active" : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: "all" }))
                      }
                    >
                      All
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item${
                        filters.status === "open" ? " active" : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: "open" }))
                      }
                    >
                      Open
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item${
                        filters.status === "closed" ? " active" : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: "closed" }))
                      }
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
            <div className="text-center text-muted py-4">No results</div>
          ) : (
            <div className="d-flex flex-column gap-2" style={{ width: "100%" }}>
              {filteredOutlets.map((outlet) => (
                <div
                  key={outlet.outlet_id}
                  className="card border-0 mb-2"
                  onClick={() => handleRestoUrl(outlet.resto_url, outlet.is_open, outlet.is_outlet_filled)}
                  style={{
                    cursor: outlet.is_open ? "pointer" : "not-allowed", // Change cursor for closed outlets
                    transition: "all 0.3s ease",
                    opacity: outlet.is_open ? 1 : 0.7, // Make closed outlets appear faded
                  }}
                  onMouseEnter={(e) => {
                    if (outlet.is_open) { // Only apply hover effect for open outlets
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 .5rem 1rem rgba(0,0,0,.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (outlet.is_open) { // Only remove hover effect for open outlets
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow =
                        "0 .125rem .25rem rgba(0,0,0,.075)";
                    }
                  }}
                >
                  <div className="card-body p-3 rounded border border-1">
                    {/* Header Section */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        {outlet.veg_nonveg === "veg" ? (
                          <span
                            className="d-flex align-items-center"
                            title="Veg"
                          >
                            <VegIcon />
                          </span>
                        ) : (
                          <span
                            className="d-flex align-items-center"
                            title="Non-Veg"
                          >
                            <NonVegIcon />
                          </span>
                        )}
                        <h6 className="card-title mb-0">
                          {outlet.outlet_name}
                        </h6>
                      </div>
                      <span
                        className={`badge rounded-pill px-3 py-2 ${
                          outlet.is_open ? "bg-success" : ""
                        }`}
                        style={
                          !outlet.is_open
                            ? { backgroundColor: "#dc3545" }
                            : undefined
                        }
                      >
                        {outlet.is_open ? "OPEN" : "CLOSED"}
                      </span>
                    </div>

                    {/* Details Section */}
                    <div className="card-text d-flex flex-column gap-2">
                      <p className="d-flex align-items-center text-muted small mb-0">
                        <i
                          className="fas fa-map-marker-alt"
                          style={{ fontSize: "16px", width: "24px" }}
                        ></i>
                        <span>{outlet.address}</span>
                      </p>
                      <p className="d-flex align-items-center text-muted small mb-0">
                        <i
                          className="fas fa-phone"
                          style={{ fontSize: "16px", width: "24px" }}
                        ></i>
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

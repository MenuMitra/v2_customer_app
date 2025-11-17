import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const OutletContext = createContext();

// Update the regex pattern to match the exact format with prefixes
const URL_PATTERN = /^\/o(\d+)\/s(\d+)\/t(\d+)$/;

// Regex: matches /o123, /o456, etc. (no /s or /t after)
const outletOnlyPattern = /^\/o\d+$/;

// Update the regex patterns at the top
const FULL_OUTLET_PATTERN =
  /^(\/menumitra_customer_app)?\/o\d+\/s\d+\/t\d+\/?$/;
const OUTLET_ONLY_PATTERN = /^(\/menumitra_customer_app)?\/o\d+\/?$/;

export const useOutlet = () => {
  const context = useContext(OutletContext);
  if (!context) {
    throw new Error("useOutlet must be used within an OutletProvider");
  }
  return context;
};

export const OutletProvider = ({ children }) => {
  // Always read from localStorage for outletInfo
  const getStoredOutlet = () => {
    const stored = localStorage.getItem("selectedOutlet");
    return stored ? JSON.parse(stored) : null;
  };

  const [outletInfo, setOutletInfo] = useState(getStoredOutlet());
  const [outletId, setOutletId] = useState(getStoredOutlet()?.outletId || null);
  const [outletDetails, setOutletDetails] = useState(getStoredOutlet() || null);
  const [isOutletOnlyUrl, setIsOutletOnlyUrl] = useState(false);

  // Add new state for orderSettings
  const [orderSettings, setOrderSettings] = useState(() => {
    const savedSettings = localStorage.getItem("orderSettings");
    return savedSettings ? JSON.parse(savedSettings) : { order_type: null };
  });

  const location = useLocation();
  const navigate = useNavigate();

  const parseOutletUrl = (url) => {
    const matches = url.match(URL_PATTERN);
    if (matches) {
      return {
        outletCode: matches[1],
        sectionId: matches[2],
        tableId: matches[3],
      };
    }
    return null;
  };

  function extractOutletParamsFromPath(pathname) {
    // Split and filter out empty segments
    const segments = pathname.split("/").filter(Boolean);
    // We expect the last three segments to be o<outletCode>, s<sectionId>, t<tableId>
    if (segments.length < 3) return null;
    const [o, s, t] = segments.slice(-3);

    const oMatch = o.match(/^o(\d+)$/);
    const sMatch = s.match(/^s(\d+)$/);
    const tMatch = t.match(/^t(\d+)$/);

    if (oMatch && sMatch && tMatch) {
      return {
        outletCode: oMatch[1],
        sectionId: sMatch[1],
        tableId: tMatch[1],
      };
    }
    return null;
  }

  // First, add a function to extract just the outlet code
  function extractOutletCode(pathname) {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const match = lastSegment?.match(/^o(\d+)$/);
    return match ? match[1] : null;
  }

  // Add function to update orderSettings
  const updateOrderSettings = (settings) => {
    const newSettings = { ...orderSettings, ...settings };
    setOrderSettings(newSettings);
    localStorage.setItem("orderSettings", JSON.stringify(newSettings));
  };

  useEffect(() => {
    const fullPath = window.location.pathname;
    const params = extractOutletParamsFromPath(fullPath);
    const stored = getStoredOutlet();

    if (params) {
      const { outletCode, sectionId, tableId } = params;
      // Existing full URL handling
      updateOrderSettings({ order_type: "dine-in" });
      if (
        !stored ||
        stored.outletCode !== outletCode ||
        stored.sectionId !== sectionId ||
        stored.tableId !== tableId
      ) {
        localStorage.setItem("outletCode", outletCode);
        localStorage.setItem("sectionId", sectionId);
        localStorage.setItem("tableId", tableId);

        fetchOutletDetailsByCode(outletCode).then((details) => {
          if (details) {
            localStorage.setItem("selectedOutlet", JSON.stringify(details));
            setOutletInfo(details);
            setOutletId(details.outletId);
            setOutletDetails(details);
          }
        });
      }
    } else {
      // Check if it's outlet-only URL
      const outletOnlyPattern = /^(\/menumitra_customer_app)?\/o\d+\/?$/;
      if (outletOnlyPattern.test(fullPath)) {
        const outletCode = extractOutletCode(fullPath);
        if (outletCode) {
          updateOrderSettings({ order_type: null });
          // Add API call for outlet-only URL
          fetchOutletDetailsByCode(outletCode).then((details) => {
            if (details) {
              localStorage.setItem("selectedOutlet", JSON.stringify(details));
              setOutletInfo(details);
              setOutletId(details.outletId);
              setOutletDetails(details);
            }
          });
        }
      }
    }
  }, [location.pathname]);

  // Updated pattern to handle basename
  useEffect(() => {
    const fullPath = location.pathname;
    const isFullOutletUrl = FULL_OUTLET_PATTERN.test(fullPath);
    const isOutletOnlyPath = OUTLET_ONLY_PATTERN.test(fullPath);

    // Only update isOutletOnlyUrl in two cases:
    // 1. When we first encounter an outlet-only URL (set to true)
    // 2. When we encounter a full outlet URL (set to false)
    if (isOutletOnlyPath && !isFullOutletUrl) {
      setIsOutletOnlyUrl(true);
    } else if (isFullOutletUrl) {
      setIsOutletOnlyUrl(false);
    }
    // Note: We don't change isOutletOnlyUrl in any other case

    console.log("URL State Change:", {
      pathname: fullPath,
      isFullOutletUrl,
      isOutletOnlyPath,
      isOutletOnlyUrl: isOutletOnlyUrl,
      action: isFullOutletUrl
        ? "setting_false"
        : isOutletOnlyPath
        ? "setting_true"
        : "no_change",
    });
  }, [location.pathname]);

  const fetchOutletDetailsByCode = async (outletCode) => {
    try {
      // Get section_id and table_id from localStorage
      const sectionId = localStorage.getItem("sectionId");
      const tableId = localStorage.getItem("tableId");

      const auth = JSON.parse(localStorage.getItem("auth")) || {};
      const accessToken = auth.accessToken;

      const response = await axios.post(
        "https://ghanish.in/v2/user/get_restaurant_details_by_code",
        {
          outlet_code: outletCode,
          section_id: sectionId || "",
          table_number: tableId || "",
          app_source: "user_app",
          user_id: auth.userId || null, // this should be optional !!!
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.data?.outlet_details) {
        const details = response.data.data.outlet_details;

        // Get existing outlet info from localStorage
        const existingOutletInfo = localStorage.getItem("selectedOutlet")
          ? JSON.parse(localStorage.getItem("selectedOutlet"))
          : {};

        const formattedOutletInfo = {
          // First spread existing data
          ...existingOutletInfo,
          // Then add new/updated data from API
          outletId: details.outlet_id,
          outletCode: outletCode,
          outletName: details.name,
          isOpen: details.is_open,
          mobile: details.mobile,
          fssaiNumber: details.fssainumber,
          gstNumber: details.gstnumber,
          address: details.address,
          ownerId: details.owner_id,
          outletType: details.outlet_type,
          outletVegNonveg: details.outlet_veg_nonveg,
          whatsapp: details.whatsapp,
          facebook: details.facebook,
          instagram: details.instagram,
          website: details.website,
          googleReview: details.google_review,
          googleBusinessLink: details.google_business_link,
          sectionName: details.section_name,
          // Use API values with fallback to existing values
          sectionId:
            details.section_id?.toString() ||
            existingOutletInfo.sectionId ||
            localStorage.getItem("sectionId"),
          tableId:
            details.table_id?.toString() ||
            existingOutletInfo.tableId ||
            localStorage.getItem("tableId"),
          tableNumber:
            details.table_number?.toString() ||
            details.table_id?.toString() ||
            existingOutletInfo.tableNumber,
        };

        // Update localStorage with merged data
        localStorage.setItem("sectionId", formattedOutletInfo.sectionId);
        localStorage.setItem("tableId", formattedOutletInfo.tableId);
        localStorage.setItem(
          "selectedOutlet",
          JSON.stringify(formattedOutletInfo)
        );

        return formattedOutletInfo;
      }
    } catch (error) {
      console.error("Error fetching outlet details:", error);
      if (error.response?.status === 404) {
        navigate("/notfound");
      }
      throw error;
    }
  };

  const updateOutletInfo = (newInfo) => {
    // Ensure we preserve section and table IDs when updating
    const updatedInfo = {
      ...newInfo,
      sectionId: newInfo.sectionId || localStorage.getItem("sectionId"),
      tableId: newInfo.tableId || localStorage.getItem("tableId"),
    };
    localStorage.setItem("selectedOutlet", JSON.stringify(updatedInfo));
    setOutletInfo(updatedInfo);
    setOutletId(updatedInfo.outletId);
    setOutletDetails(updatedInfo);
  };

  // Modify clearOutletInfo to also clear orderSettings
  const clearOutletInfo = () => {
    localStorage.removeItem("selectedOutlet");
    localStorage.removeItem("outletCode");
    localStorage.removeItem("sectionId");
    localStorage.removeItem("tableId");
    localStorage.removeItem("orderSettings");
    setOutletInfo(null);
    setOutletId(null);
    setOutletDetails(null);
    setOrderSettings({ order_type: null });
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    const stored = getStoredOutlet();
    return {
      outletInfo: stored,
      updateOutletInfo,
      clearOutletInfo,
      fetchOutletDetailsByCode,
      outletId: stored?.outletId,
      outletDetails: stored,
      setOutletId,
      setOutletDetails,
      isOutletOnlyUrl,
      outletCode: stored?.outletCode,
      sectionId: stored?.sectionId,
      tableId: stored?.tableId,
      tableNumber: stored?.tableNumber,
      outletName: stored?.outletName,
      isOpen: stored?.isOpen,
      mobile: stored?.mobile,
      fssaiNumber: stored?.fssaiNumber,
      gstNumber: stored?.gstNumber,
      address: stored?.address,
      ownerId: stored?.ownerId,
      outletType: stored?.outletType,
      outletVegNonveg: stored?.outletVegNonveg,
      whatsapp: stored?.whatsapp,
      facebook: stored?.facebook,
      instagram: stored?.instagram,
      website: stored?.website,
      googleReview: stored?.googleReview,
      googleBusinessLink: stored?.googleBusinessLink,
      sectionName: stored?.sectionName,
      orderSettings,
      updateOrderSettings,
    };
  }, [outletInfo, isOutletOnlyUrl, orderSettings]);

  return (
    <OutletContext.Provider value={contextValue}>
      {children}
    </OutletContext.Provider>
  );
};

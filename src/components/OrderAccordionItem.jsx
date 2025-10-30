import React from "react";
import { useNavigate } from "react-router-dom";
import Timer from "./Timer";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import axios from "axios";
import MenuMitra from "../assets/logo.png"; // adjust path as needed

const OrderAccordionItem = ({
  orderId,
  orderNumber,
  itemCount,
  status,
  iconColor = "#FFA902", // default color
  iconBgClass = "", // for bg-primary, bg-danger etc
  showTimer = false,
  remainingSeconds = 0,
  outletName,
  orderType,
  totalAmount,
  paymentStatus,
  orderTime,
  tableNumber,
  sectionName,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent accordion toggle
    navigate(`/order-detail/${orderId}`);
  };

  const generatePDF = async (orderDetails) => {
    try {
      if (!orderDetails?.order_details) {
        window.showToast("error", "Order details not found");
        return;
      }

      const { order_details, menu_details } = orderDetails;
      const outlet_name =
        localStorage.getItem("outlet_name") || order_details.outlet_name || "";
      const outlet_address = localStorage.getItem("outlet_address") || "-";
      const outlet_mobile = localStorage.getItem("outlet_mobile") || "-";
      const website_url = "https://menumitra.com";
      const customerName =
        localStorage.getItem("customerName") ||
        order_details.customer_name ||
        "Guest";

      // Add current date and time for PDF generation timestamp
      const now = new Date();
      const generationDate = now.toLocaleDateString();
      const generationTime = now
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace("am", "AM")
        .replace("pm", "PM");

      // Create a hidden container with specific dimensions
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.style.width = "800px";
      container.style.margin = "0";
      container.style.padding = "20px";
      container.style.fontSize = "16px";
      container.style.backgroundColor = "#ffffff";
      document.body.appendChild(container);

      container.innerHTML = `
        <div style="padding: 20px; max-width: 100%; margin: auto; font-family: Arial, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div style="display: flex; align-items: center;">
              <img src="${MenuMitra}" alt="MenuMitra Logo" style="width: 35px; height: 35px;" />
              <span style="font-size: 20px; font-weight: bold; margin-left: 8px;">MenuMitra</span>
            </div>
            <span style="color: #d9534f; font-size: 20px; font-weight: normal;">Invoice</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
            <div>
              <p style="margin: 0; font-weight: bold;">Hello, ${customerName}</p>
              <p style="margin: 5px 0 0 0; color: #333;">Thank you for shopping from our store and for your order.</p>
          </div>
          <div style="text-align: right;">
              <p style="margin: 0;">Bill no: ${order_details.order_number}</p>
              <p style="margin: 5px 0 0 0; color: #666;">${
                order_details.date || ""
              } ${generationTime || ""}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 1px solid #ddd; color: #333;">Item</th>
              <th style="text-align: center; padding: 8px 0; border-bottom: 1px solid #ddd; color: #333;">Quantity</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 1px solid #ddd; color: #333;">Price</th>
            </tr>
            ${menu_details
              .map(
                (item) => `
              <tr>
                <td style="padding: 8px 0; color: #d9534f;">${
                  item.menu_name
                }</td>
                <td style="text-align: center; padding: 8px 0;">${
                  item.quantity
                }</td>
                <td style="text-align: right; padding: 8px 0;">₹ ${item.price.toFixed(
                  2
                )}</td>
              </tr>
            `
              )
              .join("")}
        </table>

          <!-- Billing Summary -->
<div style="border-top: 2px solid #ddd; margin-top: 20px;">
  <div style="text-align: right; margin-top: 10px;">
    <!-- Total -->
    ${
      order_details.total_bill_amount
        ? `<span style="font-weight: bold;">Total:</span> ₹${order_details.total_bill_amount.toFixed(
            2
          )}</br>`
        : ""
    }

    <!-- Discount -->
    ${
      order_details.discount_percent > 0
        ? `<span style="font-weight: bold;">Discount:</span>(${
            order_details.discount_percent
          }%): <span style="color: red;">-₹${order_details.discount_amount.toFixed(
            2
          )}</span></br>`
        : ""
    }

    <!-- Special Discount -->
    ${
      order_details.special_discount
        ? `<span style="font-weight: bold;">Special Discount:</span><span style="color: red;">-₹${order_details.special_discount.toFixed(
            2
          )}</span></br>`
        : ""
    }
    <!-- Extra Charges -->
    ${
      order_details.charges > 0
        ? `<span style="font-weight: bold;">Extra Charges:</span><span style="color: green;">+₹${order_details.charges.toFixed(
            2
          )}</span></br>`
        : ""
    }
    <!-- Subtotal -->
    ${
      order_details.total_bill_with_discount
        ? `<span style="font-weight: bold;">Subtotal:</span> ₹${order_details.total_bill_with_discount.toFixed(
            2
          )}</br>`
        : ""
    }
    <!-- Service Charges -->
          ${
            order_details.service_charges_amount
              ? `<span style="font-weight: bold;">Service Charges (${
                  order_details.service_charges_percent || ""
                }%):</span> <span style="color: green;">+₹${order_details.service_charges_amount.toFixed(
                  2
                )}</span></br>`
              : ""
          }

    <!-- GST -->
    ${
      order_details.gst_amount
        ? `<span style="font-weight: bold;">GST (${
            order_details.gst_percent || ""
          }%):</span> <span style="color: green;">+₹${order_details.gst_amount.toFixed(
            2
          )}</span></br>`
        : ""
    }
<!-- Tip -->
          ${
            order_details.tip && order_details.tip > 0
              ? `<span style="font-weight: bold;">Tip:</span><span style="color: green;">+₹${order_details.tip.toFixed(
                  2
                )}</span></br>`
              : ""
          }


    <!-- Grand Total -->
    ${
      order_details.final_grand_total
        ? `<span style="font-weight: bold;">Grand Total:</span> ₹${order_details.final_grand_total.toFixed(
            2
          )}</br>`
        : ""
    }
  </div>
</div>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div>
              <p style="margin: 0 0 10px 0; font-weight: bold;">Billing Information</p>
              <p style="margin: 5px 0;">► ${outlet_name}</p>
              <p style="margin: 5px 0;">► ${outlet_address}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Payment Method</p>
              <p style="margin: 5px 0; text-transform: uppercase;">${
                order_details.payment_method || ""
              }</p>
        </div>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <p style="font-style: italic; margin-bottom: 20px;">Have a nice day.</p>
            <div style="margin: 20px 0;">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <img src="${MenuMitra}" alt="MenuMitra Logo" style="width: 25px; height: 25px;" />
                <span style="font-size: 16px; font-weight: bold; margin-left: 8px;">MenuMitra</span>
          </div>
        </div>
            <p style="margin: 3px 0; color: #666; font-size: 13px;">info@menumitra.com</p>
            <p style="margin: 3px 0; color: #666; font-size: 13px;">+91 9172530151</p>
            <p style="margin: 3px 0; color: #666; font-size: 13px;">${website_url}</p>
</div>
      </div>
    `;

      try {
        // Wait for all images to load
        const images = container.getElementsByTagName("img");
        await Promise.all(
          Array.from(images).map((img) => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            });
          })
        );

        // Generate PDF with exact same configuration as MyOrder.js
        const canvas = await html2canvas(container, {
          scale: 3,
          width: 800,
          height: container.offsetHeight,
          backgroundColor: "#ffffff",
          windowWidth: 800,
          windowHeight: container.offsetHeight,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        // Create PDF with A4 dimensions
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });

        // Calculate dimensions to fit A4 while maintaining aspect ratio
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add image with proper scaling
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${order_details.order_number}.pdf`);

        window.showToast("success", "Invoice downloaded successfully");
      } catch (error) {
        console.error("PDF generation error:", error);
        window.showToast("error", "Failed to generate invoice");
      } finally {
        // Clean up: Remove the temporary container
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      window.showToast("error", "Failed to generate invoice");
    }
  };

  const handleDownloadInvoice = async (e) => {
    e.stopPropagation(); // Prevent accordion toggle
    try {
      const auth = JSON.parse(localStorage.getItem("auth")) || {};
      const accessToken = auth.accessToken;
      const userId = auth.userId;

      if (!accessToken) {
        console.error("Authentication token not found");
        return;
      }

      const response = await axios.post(
        "https://men4u.xyz/v2/user/get_order_details",
        {
          order_id: orderId,
          user_id: parseInt(userId),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const orderDetails = response.data.detail;

      if (!orderDetails) {
        console.error("Order details not found");
        return;
      }

      generatePDF(orderDetails);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  // Handle tableNumber which might be an array
  const displayTableNumber = Array.isArray(tableNumber)
    ? tableNumber.join(", ")
    : tableNumber;

  return (
    <>
      {showTimer && (
        <div className="d-flex justify-content-center align-items-center mb-2">
          <Timer initialSeconds={remainingSeconds} />
        </div>
      )}
      <div
        className="order-item mb-3"
        onClick={handleViewDetails}
        style={{ cursor: "pointer" }}
      >
        <div className="border rounded shadow-sm p-3">
          <div className="d-flex align-items-center justify-content-between w-100">
            <div
              className="d-flex flex-column align-items-start"
              style={{ minHeight: 70 }}
            >
              <div className="d-flex align-items-center gap-2 mb-0">
                <h6 className="mb-0">#{orderNumber}</h6>
                {status === 'cooking' && (
                  <span style={{fontWeight: 700, color: '#999999', fontSize: '13px', marginLeft: 6}}>
                    (COOKING)
                  </span>
                )}
                {/* Status badge next to order number (other statuses kept as is) */}
                {paymentStatus === "Paid" ? (
                  <span
                    className="badge bg-success text-white"
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "6px",
                    }}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>Paid
                  </span>
                ) : status === "cancelled" ? (
                  <span
                    className="badge bg-danger text-white"
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "6px",
                    }}
                  >
                    <i className="bi bi-x-circle-fill me-1"></i>Cancelled
                  </span>
                ) : status === "udhari_pending" ? (
                  <span
                    className="badge bg-warning text-dark"
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "6px",
                    }}
                  >
                    {/* <i className="fa fa-hourglass-half me-1"></i>Udhari Pending */}
                  </span>
                ) : null}
              </div>
              <p
                className="mb-0 text-dark font-weight-bold "
                style={{ fontSize: "14px " }}
              >
                {outletName}
              </p>
              <p className="mb-0" style={{ fontSize: "14px", color: "#999999", fontWeight: 500 }}>
                {/* Capitalize DINE-IN and normal dark grey text for details */}
                {(orderType && orderType.toLowerCase() === "dine-in") ? "DINE-IN" : orderType} • {itemCount} Menu
              </p>
            </div>
            <div className="text-end">
              <p className="mb-0" style={{ fontSize: "14px", color: "#999999", fontWeight: 500 }}>
                {orderTime}
              </p>
              <p className="mb-0" style={{ fontSize: "14px", color: "#999999", fontWeight: 500 }}>
                {/* Section and table, normal dark grey */}
                {sectionName && displayTableNumber ? (
                  <>
                    <i className="bi bi-geo-alt-fill me-2"></i> {sectionName} - {displayTableNumber}
                  </>
                ) : sectionName ? (
                  <>
                    <i className="bi bi-geo-alt-fill me-2"></i> {sectionName}
                  </>
                ) : displayTableNumber ? (
                  <>
                    <i className="bi bi-geo-alt-fill me-2"></i> {displayTableNumber}
                  </>
                ) : null}
              </p>
              <h6 className="mb-2" style={{ color: "#219150", fontWeight: 600 }}>
                ₹{totalAmount}
              </h6>
              {/* {status !== "Cancelled" && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleDownloadInvoice}
                  style={{ borderRadius: "8px", fontSize: "12px" }}
                >
                  <i className="bi bi-download me-1"></i> Invoice
                </button>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderAccordionItem;

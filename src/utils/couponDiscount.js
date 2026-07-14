const parseMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatMoney = (value) => parseMoney(value).toFixed(2);

export const isFlatCouponType = (type) => {
  const normalized = String(type ?? "amount").toLowerCase().trim();
  return [
    "amount",
    "flat",
    "fixed",
    "flat_rate",
    "flatrate",
    "value",
    "rupee",
    "rupees",
  ].includes(normalized);
};

export const isPercentCouponType = (type) => {
  const normalized = String(type ?? "").toLowerCase().trim();
  return ["percentage", "percent", "percentage_discount", "pct", "%"].includes(
    normalized
  );
};

export const normalizeCouponDetails = (coupon = {}) => ({
  code: coupon.code ?? coupon.coupon_code ?? "",
  type: coupon.type ?? coupon.discount_type ?? "amount",
  value: coupon.value ?? coupon.discount_value ?? 0,
  maxDiscount:
    coupon.maxDiscount ??
    coupon.max_discount ??
    coupon.max_discount_amount ??
    null,
  appliedAmount:
    coupon.appliedAmount ??
    coupon.applied_discount ??
    coupon.coupon_discount ??
    coupon.discount_amount ??
    null,
});

export const computeCouponDiscountAmount = (baseAmount, couponInput) => {
  const base = parseMoney(baseAmount);
  if (base <= 0 || !couponInput) return 0;

  const coupon = normalizeCouponDetails(couponInput);
  const configuredValue = parseMoney(coupon.value);
  const maxDiscount = parseMoney(coupon.maxDiscount);

  if (isPercentCouponType(coupon.type)) {
    const percentDiscount = (base * configuredValue) / 100;
    const capped = maxDiscount > 0 ? Math.min(percentDiscount, maxDiscount) : percentDiscount;
    return Math.min(base, capped);
  }

  if (isFlatCouponType(coupon.type)) {
    return Math.min(base, configuredValue);
  }

  // Unknown type: treat numeric values <= 100 as percent, otherwise flat amount.
  if (configuredValue > 0 && configuredValue <= 100) {
    return Math.min(base, (base * configuredValue) / 100);
  }

  return Math.min(base, configuredValue);
};

export const resolveCouponAppliedAmount = ({
  couponDetails,
  couponDiscount,
  billBeforeCoupon,
}) => {
  if (!couponDetails) return parseMoney(couponDiscount);

  const billBefore = parseMoney(billBeforeCoupon);
  const apiAmount = parseMoney(couponDiscount);
  const computed = computeCouponDiscountAmount(billBefore, couponDetails);

  if (isFlatCouponType(couponDetails.discount_type)) {
    return computed;
  }

  if (apiAmount > 0) return apiAmount;
  return computed;
};

export const formatCouponLabel = (couponDetails) => {
  if (!couponDetails) return "Coupon";

  const coupon = normalizeCouponDetails(couponDetails);
  const code = coupon.code || couponDetails.coupon_code || "Coupon";

  if (isFlatCouponType(coupon.type)) {
    return `${code} - Flat ₹${formatMoney(coupon.value)}`;
  }

  if (isPercentCouponType(coupon.type)) {
    const maxPart =
      parseMoney(coupon.maxDiscount) > 0
        ? ` (max ₹${formatMoney(coupon.maxDiscount)})`
        : "";
    return `${code} - ${formatMoney(coupon.value)}% off${maxPart}`;
  }

  return `${code} - ₹${formatMoney(coupon.value)} off`;
};

export const buildCouponDetailsFromVerifyResponse = (data, baseAmount) => {
  const couponDetails = normalizeCouponDetails({
    code: data.coupon_code,
    type: data.discount_type,
    value: data.discount_value,
    maxDiscount: data.max_discount_amount ?? data.max_discount,
    appliedAmount:
      data.coupon_discount ?? data.discount_amount ?? data.applied_discount,
  });

  const computed = computeCouponDiscountAmount(baseAmount, couponDetails);
  const appliedFromApi = parseMoney(couponDetails.appliedAmount);

  return {
    ...couponDetails,
    appliedAmount: isFlatCouponType(couponDetails.type)
      ? computed
      : appliedFromApi > 0
        ? appliedFromApi
        : computed,
  };
};

export const computeBillSummary = ({
  checkoutDetails,
  cartTotal,
  couponDetails,
}) => {
  const totalBill = checkoutDetails
    ? parseMoney(checkoutDetails.total_bill_amount)
    : parseMoney(cartTotal);
  const discountAmount = checkoutDetails
    ? parseMoney(checkoutDetails.discount_amount)
    : 0;
  const baseAfterOfferDiscount =
    checkoutDetails?.total_bill_with_discount != null
      ? parseMoney(checkoutDetails.total_bill_with_discount)
      : Math.max(0, totalBill - discountAmount);

  const couponBaseAmount = baseAfterOfferDiscount;
  const couponDiscountAmount = couponDetails
    ? parseMoney(couponDetails.appliedAmount) > 0
      ? parseMoney(couponDetails.appliedAmount)
      : computeCouponDiscountAmount(couponBaseAmount, couponDetails)
    : 0;

  const totalAfterDiscount = Math.max(
    0,
    baseAfterOfferDiscount - couponDiscountAmount
  );
  const serviceCharge = checkoutDetails
    ? parseMoney(checkoutDetails.service_charges_amount)
    : 0;
  const gstAmount = checkoutDetails
    ? parseMoney(checkoutDetails.gst_amount)
    : 0;
  const grandTotal = totalAfterDiscount + serviceCharge;
  const payableAmount = grandTotal + gstAmount;

  return {
    totalBill,
    discountAmount,
    couponDiscountAmount,
    totalAfterDiscount,
    serviceCharge,
    grandTotal,
    gstAmount,
    payableAmount,
  };
};

export const buildOrderPaymentBreakdown = (orderDetails = {}) => {
  const billBeforeCoupon = parseMoney(
    orderDetails.coupon_details?.total_bill_before_coupon ??
      orderDetails.total_bill_amount
  );
  const offerDiscount = parseMoney(orderDetails.discount_amount);
  const specialDiscount = parseMoney(orderDetails.special_discount);
  const charges = parseMoney(orderDetails.charges);
  const tip = parseMoney(orderDetails.tip);

  const couponDiscount = orderDetails.coupon_details
    ? resolveCouponAppliedAmount({
        couponDetails: orderDetails.coupon_details,
        couponDiscount: orderDetails.coupon_discount,
        billBeforeCoupon,
      })
    : parseMoney(orderDetails.coupon_discount);

  const subtotal = Math.max(
    0,
    billBeforeCoupon - offerDiscount - couponDiscount - specialDiscount + charges
  );

  const servicePercent = parseMoney(orderDetails.service_charges_percent);
  const gstPercent = parseMoney(orderDetails.gst_percent);
  const shouldRecalculateTaxes = Boolean(orderDetails.coupon_details);

  const serviceAmount = shouldRecalculateTaxes
    ? (subtotal * servicePercent) / 100
    : parseMoney(orderDetails.service_charges_amount);
  const gstAmount = shouldRecalculateTaxes
    ? ((subtotal + serviceAmount) * gstPercent) / 100
    : parseMoney(orderDetails.gst_amount);
  const grandTotal = shouldRecalculateTaxes
    ? subtotal + serviceAmount + gstAmount + tip
    : parseMoney(orderDetails.final_grand_total);

  return {
    billBeforeCoupon,
    offerDiscount,
    couponDiscount,
    specialDiscount,
    charges,
    subtotal,
    serviceAmount,
    gstAmount,
    tip,
    grandTotal,
    afterTotalDiscount: Math.max(0, billBeforeCoupon - offerDiscount - couponDiscount),
  };
};

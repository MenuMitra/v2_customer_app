export const getDisplayPortionLabel = (value) => {
  const str = value == null ? "" : String(value).trim();
  if (!str) return "";

  if (str.toLowerCase() === "default") {
    return "Regular";
  }

  return str
    .split(/\s+/)
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(" ");
};

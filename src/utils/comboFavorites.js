const getKey = (userId, outletId) =>
  `combo_favorites:${String(userId || "")}:${String(outletId || "")}`;

const normalizeId = (comboMasterId) => {
  const parsed = Number(comboMasterId);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getComboFavoriteIds = ({ userId, outletId }) => {
  if (!userId || !outletId) return [];
  try {
    const raw = localStorage.getItem(getKey(userId, outletId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((id) => normalizeId(id))
      .filter((id) => id !== null);
  } catch (error) {
    console.error("Failed to read combo favorites:", error);
    return [];
  }
};

export const isComboFavorite = ({ userId, outletId, comboMasterId }) => {
  const normalized = normalizeId(comboMasterId);
  if (normalized === null) return false;
  return getComboFavoriteIds({ userId, outletId }).includes(normalized);
};

export const setComboFavoriteIds = ({ userId, outletId, ids }) => {
  if (!userId || !outletId) return;
  const normalized = Array.from(
    new Set((ids || []).map((id) => normalizeId(id)).filter((id) => id !== null))
  );
  localStorage.setItem(getKey(userId, outletId), JSON.stringify(normalized));
};

export const toggleComboFavorite = ({ userId, outletId, comboMasterId }) => {
  const normalized = normalizeId(comboMasterId);
  if (!userId || !outletId || normalized === null) {
    return { nextIsFavorite: false, ids: [] };
  }

  const existing = getComboFavoriteIds({ userId, outletId });
  const isAlreadyFavorite = existing.includes(normalized);
  const next = isAlreadyFavorite
    ? existing.filter((id) => id !== normalized)
    : [...existing, normalized];

  setComboFavoriteIds({ userId, outletId, ids: next });
  return { nextIsFavorite: !isAlreadyFavorite, ids: next };
};

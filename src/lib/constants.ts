export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const ORDER_STATUS_LABELS = {
  PENDING: "En attente",
  VALIDATED: "Validée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
} as const;

export const COST_TYPE_LABELS = {
  FIXED: "Charge fixe",
  VARIABLE: "Charge variable",
  OTHER: "Autre",
} as const;

export const ROLE_LABELS = {
  USER: "Client",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
} as const;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `EP-${stamp}-${rand}`;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("libraryToken");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export function normalizeBook(book) {
  if (!book) return null;
  return {
    ...book,
    id: book._id || book.id,
    price: typeof book.price === "number" ? book.price : Number(book.price) || 0,
    available: book.available !== undefined ? Boolean(book.available) : true,
    favorite: Boolean(book.favorite),
  };
}

export { API_BASE_URL };

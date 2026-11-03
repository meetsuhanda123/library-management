const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("libraryToken");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error(`[API Network Error] Failed to fetch ${API_BASE_URL}${path}:`, err);
    throw new Error(
      `Failed to connect to backend server (${API_BASE_URL}). If using Render, the service may be starting up (allow 30-50 seconds).`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  // Guard against HTML response when JSON is expected (e.g. Render serving static site or 404 HTML)
  if (!contentType.includes("application/json")) {
    const rawText = await response.text().catch(() => "");
    if (!response.ok) {
      throw new Error(`Server returned error ${response.status}: ${rawText.slice(0, 100)}`);
    }
    // If status 200 OK but returned HTML, backend URL is misconfigured
    throw new Error(
      `Received HTML instead of JSON from ${API_BASE_URL}${path}. The backend URL points to a static page instead of the Express API.`
    );
  }

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

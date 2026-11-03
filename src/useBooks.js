import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, normalizeBook } from "./api";

export default function useBooks() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/books");
      const list = Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : [];
      setBooks(list.map(normalizeBook));
    } catch (err) {
      setError(err.message || "Unable to load books. Check that the backend is running.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch remote data once when the hook mounts.
    refreshBooks();
    // refreshBooks is stable (useCallback with no dependencies).
  }, [refreshBooks]);

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return books.filter((book) => {
      const matchesSearch = `${book.title || ""} ${book.author || book.author_name || ""} ${book.category || ""}`.toLowerCase().includes(query);
      const matchesCategory = category === "All" || book.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [books, search, category]);

  return { books, setBooks, search, setSearch, category, setCategory, loading, error, filteredBooks, refreshBooks };
}

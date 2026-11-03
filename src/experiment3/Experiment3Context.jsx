import React, { createContext, useContext, useMemo, useReducer } from "react";
import useBooks from "../useBooks.js";
import { apiRequest } from "../api.js";

const Experiment3Context = createContext(null);
const initialState = { search: "", category: "All", availableOnly: false, favoritesOnly: false };
function reducer(state, action) {
  switch (action.type) {
    case "SET_SEARCH": return { ...state, search: action.payload };
    case "SET_CATEGORY": return { ...state, category: action.payload };
    case "TOGGLE_AVAILABLE": return { ...state, availableOnly: !state.availableOnly };
    case "TOGGLE_FAVORITES_FILTER": return { ...state, favoritesOnly: !state.favoritesOnly };
    case "RESET_FILTERS": return initialState;
    default: return state;
  }
}

export function Experiment3Provider({ children }) {
  const [filters, dispatch] = useReducer(reducer, initialState);
  const { books, loading, error, refreshBooks } = useBooks();
  const filteredBooks = useMemo(() => books.filter((book) => {
    const query = filters.search.toLowerCase().trim();
    const matchesSearch = `${book.title || ""} ${book.author || ""}`.toLowerCase().includes(query);
    return matchesSearch && (filters.category === "All" || book.category === filters.category) &&
      (!filters.availableOnly || book.available) && (!filters.favoritesOnly || book.favorite);
  }), [books, filters]);

  const addBook = async (payload) => {
    await apiRequest("/api/books", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        price: payload.price !== undefined ? Number(payload.price) : 299,
        available: true,
      }),
    });
    await refreshBooks();
  };
  const removeBook = async (id) => {
    await apiRequest(`/api/books/${id}`, { method: "DELETE" });
    await refreshBooks();
  };
  const toggleFavorite = async (book) => {
    await apiRequest(`/api/books/${book.id}`, { method: "PUT", body: JSON.stringify({ favorite: !book.favorite }) });
    await refreshBooks();
  };

  return <Experiment3Context.Provider value={{
    books, loading, error, search: filters.search, category: filters.category,
    availableOnly: filters.availableOnly, favoritesOnly: filters.favoritesOnly,
    filteredBooks, dispatch, addBook, removeBook, toggleFavorite,
  }}>{children}</Experiment3Context.Provider>;
}

export function useExperiment3() {
  const context = useContext(Experiment3Context);
  if (!context) throw new Error("useExperiment3 must be used inside Experiment3Provider");
  return context;
}

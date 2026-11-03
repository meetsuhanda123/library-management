import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";
import { useToast } from "./ToastContext";

export default function useSocket(onEvent) {
  const { showToast } = useToast();

  useEffect(() => {
    let socket;
    try {
      socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on("connect", () => {
        // Connected quietly
      });

      socket.on("book:added", (data) => {
        showToast(data.message || "A new book was added!", "info");
        if (onEvent) onEvent("book:added", data);
      });

      socket.on("book:updated", (data) => {
        showToast(data.message || "A book was updated.", "info");
        if (onEvent) onEvent("book:updated", data);
      });

      socket.on("book:deleted", (data) => {
        showToast(data.message || "A book was deleted from the library.", "warning");
        if (onEvent) onEvent("book:deleted", data);
      });

      socket.on("book:borrowed", (data) => {
        showToast(data.message || "A book was borrowed.", "info");
        if (onEvent) onEvent("book:borrowed", data);
      });

      socket.on("book:returned", (data) => {
        showToast(data.message || "A book was returned to the shelves.", "success");
        if (onEvent) onEvent("book:returned", data);
      });
    } catch (e) {
      console.warn("Socket initialization failed:", e.message);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [showToast, onEvent]);
}


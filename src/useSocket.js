import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";
import { useToast } from "./ToastContext";

export default function useSocket(onEvent, enableToast = false) {
  const { showToast } = useToast();
  const onEventRef = useRef(onEvent);
  const showToastRef = useRef(showToast);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    let socket;
    try {
      socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        withCredentials: true,
      });

      socket.on("book:added", (data) => {
        if (enableToast) {
          showToastRef.current?.(data.message || "A new book was added!", "info");
        }
        onEventRef.current?.("book:added", data);
      });

      socket.on("book:updated", (data) => {
        if (enableToast) {
          showToastRef.current?.(data.message || "A book was updated.", "info");
        }
        onEventRef.current?.("book:updated", data);
      });

      socket.on("book:deleted", (data) => {
        if (enableToast) {
          showToastRef.current?.(data.message || "A book was deleted from the library.", "warning");
        }
        onEventRef.current?.("book:deleted", data);
      });

      socket.on("book:borrowed", (data) => {
        if (enableToast) {
          showToastRef.current?.(data.message || "A book was borrowed.", "info");
        }
        onEventRef.current?.("book:borrowed", data);
      });

      socket.on("book:returned", (data) => {
        if (enableToast) {
          showToastRef.current?.(data.message || "A book was returned to the shelves.", "success");
        }
        onEventRef.current?.("book:returned", data);
      });
    } catch (e) {
      console.warn("Socket initialization failed:", e.message);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [enableToast]);
}

import { useState, useCallback } from "react";
import type { RouteKey } from "./routes.js";

export type Overlay = "help" | "palette" | null;

export type AppState = {
  route: RouteKey;
  overlay: Overlay;
  focusIndex: number;
  inputCaptured: boolean;
  setRoute: (route: RouteKey) => void;
  setOverlay: (overlay: Overlay) => void;
  toggleHelp: () => void;
  togglePalette: () => void;
  closeOverlay: () => void;
  cycleFocus: () => void;
  setInputCaptured: (captured: boolean) => void;
};

export function useAppState(initialRoute: RouteKey = "dashboard"): AppState {
  const [route, setRoute] = useState<RouteKey>(initialRoute);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [inputCaptured, setInputCaptured] = useState<boolean>(false);

  const toggleHelp = useCallback(() => {
    setOverlay((current) => (current === "help" ? null : "help"));
  }, []);

  const togglePalette = useCallback(() => {
    setOverlay((current) => (current === "palette" ? null : "palette"));
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
  }, []);

  const cycleFocus = useCallback(() => {
    setFocusIndex((idx) => (idx + 1) % 4);
  }, []);

  return {
    route,
    overlay,
    focusIndex,
    inputCaptured,
    setRoute,
    setOverlay,
    toggleHelp,
    togglePalette,
    closeOverlay,
    cycleFocus,
    setInputCaptured,
  };
}

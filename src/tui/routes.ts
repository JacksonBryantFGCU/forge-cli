export type RouteKey =
  | "dashboard"
  | "doctor"
  | "recipes"
  | "prompts"
  | "launch"
  | "config"
  | "onboarding";

export type Route = {
  key: RouteKey;
  label: string;
  numericKey: string;
};

export const routes: Route[] = [
  { key: "dashboard", label: "Dashboard", numericKey: "1" },
  { key: "doctor", label: "Doctor", numericKey: "2" },
  { key: "recipes", label: "Recipes", numericKey: "3" },
  { key: "prompts", label: "Prompts", numericKey: "4" },
  { key: "launch", label: "Launch", numericKey: "5" },
  { key: "config", label: "Config", numericKey: "6" },
  { key: "onboarding", label: "Welcome", numericKey: "" },
];

export function findRouteByNumericKey(key: string): Route | undefined {
  if (key.length === 0) return undefined;
  return routes.find((r) => r.numericKey === key);
}

export function findRouteByKey(key: RouteKey): Route {
  const route = routes.find((r) => r.key === key);
  if (!route) {
    throw new Error(`Unknown route: ${key}`);
  }
  return route;
}

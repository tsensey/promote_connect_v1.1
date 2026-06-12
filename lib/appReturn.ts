import { Capacitor } from "@capacitor/core";

import { logger } from "@/lib/logger";
import { supabaseClient } from "./client";

export type AppReturnSource = "web" | "native";

export interface AppReturnUrls {
  source: AppReturnSource;
  success_url: string;
  cancel_url: string;
  fallback_success_url: string;
  fallback_cancel_url: string;
}

interface ExternalRouteResolution {
  route: string;
  authSession:
    | {
        accessToken: string;
        refreshToken: string;
      }
    | null;
  authCode: string | null;
}

const DEFAULT_WEB_APP_URL = "https://promote-connect.pro";
export const NATIVE_APP_SCHEME = "com.promoteconnect.app://";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function getWebAppBaseUrl(): string {
  const configuredBase = trimTrailingSlash(
    process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_WEB_APP_URL,
  );

  if (typeof window === "undefined") {
    return configuredBase;
  }

  const currentOrigin = trimTrailingSlash(window.location.origin);
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhost) {
    return currentOrigin;
  }

  return currentOrigin.startsWith("http") ? currentOrigin : configuredBase;
}

function buildWebUrl(path: string): string {
  const normalizedPath = ensureLeadingSlash(path);
  return `${getWebAppBaseUrl()}${normalizedPath}`;
}

function joinUrlParams(baseUrl: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

function mapInternalPathToNative(path: string): string {
  const url = new URL(buildWebUrl(path));
  const params = new URLSearchParams(url.search);

  if (url.pathname.startsWith("/auth")) {
    return joinUrlParams(`${NATIVE_APP_SCHEME}auth/callback`, params);
  }

  if (url.pathname.startsWith("/app/subscription")) {
    return joinUrlParams(`${NATIVE_APP_SCHEME}subscription`, params);
  }

  if (url.pathname.startsWith("/app/marketplace/order/")) {
    const orderId = url.pathname.split("/").filter(Boolean).pop();
    return joinUrlParams(
      `${NATIVE_APP_SCHEME}marketplace/order/${orderId ?? ""}`,
      params,
    );
  }

  if (url.pathname.startsWith("/app/marketplace")) {
    return joinUrlParams(`${NATIVE_APP_SCHEME}marketplace`, params);
  }

  return joinUrlParams(
    `${NATIVE_APP_SCHEME}${url.pathname.replace(/^\/+/, "")}`,
    params,
  );
}

function getUrlParamsFromString(url: string): URLSearchParams {
  const parsedUrl = new URL(url);
  const merged = new URLSearchParams(parsedUrl.search);
  const rawHash = parsedUrl.hash.replace(/^#/, "");

  if (rawHash && !rawHash.startsWith("/")) {
    const hashParams = new URLSearchParams(rawHash);
    hashParams.forEach((value, key) => {
      if (!merged.has(key)) {
        merged.set(key, value);
      }
    });
  }

  return merged;
}

function buildInternalRoute(pathname: string, params: URLSearchParams): string {
  const segments = pathname.split("/").filter(Boolean);
  const topLevel = segments[0] ?? "";

  let internalPath = pathname || "/";
  if (topLevel === "auth") {
    internalPath = "/auth";
  }

  const routeParams = new URLSearchParams(params);
  [
    "access_token",
    "refresh_token",
    "expires_at",
    "expires_in",
    "provider_token",
    "provider_refresh_token",
    "token_type",
    "code",
  ].forEach((key) => routeParams.delete(key));

  const query = routeParams.toString();
  if (!query) return internalPath;
  return internalPath.includes("?") ? `${internalPath}&${query}` : `${internalPath}?${query}`;
}

function resolveExternalRoute(url: string): ExternalRouteResolution | null {
  try {
    const parsedUrl = new URL(url);
    const params = getUrlParamsFromString(url);
    
    let pathSegments: string[];
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      pathSegments = [
        parsedUrl.hostname,
        ...parsedUrl.pathname.split("/").filter(Boolean),
      ].filter(Boolean);
    } else {
      pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    }

    const pathname = `/${pathSegments.join("/")}`;
    return {
      route: buildInternalRoute(pathname, params),
      authSession:
        params.get("access_token") && params.get("refresh_token")
          ? {
              accessToken: params.get("access_token") ?? "",
              refreshToken: params.get("refresh_token") ?? "",
            }
          : null,
      authCode: params.get("code"),
    };
  } catch (error) {
    logger.warn("[appReturn] Failed to resolve external route", error);
    return null;
  }
}

export function getCurrentUrlParams(url?: string): URLSearchParams {
  if (url) {
    return getUrlParamsFromString(url);
  }

  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return getUrlParamsFromString(window.location.href);
}

export function getAppReturnSource(): AppReturnSource {
  return Capacitor.isNativePlatform() ? "native" : "web";
}

export function buildHybridReturnUrls(paths: {
  successPath: string;
  cancelPath?: string;
}): AppReturnUrls {
  const normalizedSuccessPath = ensureLeadingSlash(paths.successPath);
  const normalizedCancelPath = ensureLeadingSlash(
    paths.cancelPath ?? paths.successPath,
  );

  const fallback_success_url = buildWebUrl(normalizedSuccessPath);
  const fallback_cancel_url = buildWebUrl(normalizedCancelPath);

  if (!Capacitor.isNativePlatform()) {
    return {
      source: "web",
      success_url: fallback_success_url,
      cancel_url: fallback_cancel_url,
      fallback_success_url,
      fallback_cancel_url,
    };
  }

  return {
    source: "native",
    success_url: mapInternalPathToNative(normalizedSuccessPath),
    cancel_url: mapInternalPathToNative(normalizedCancelPath),
    fallback_success_url,
    fallback_cancel_url,
  };
}

export function buildAuthRedirectUrl(params?: Record<string, string | undefined>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      queryParams.set(key, value);
    }
  });

  const basePath = joinUrlParams("/auth", queryParams);
  return Capacitor.isNativePlatform()
    ? mapInternalPathToNative(basePath)
    : buildWebUrl(basePath);
}

export async function handleIncomingAppUrl(url: string): Promise<string | null> {
  const resolution = resolveExternalRoute(url);
  if (!resolution) {
    return null;
  }

  try {
    if (resolution.authSession) {
      const { error } = await supabaseClient.auth.setSession({
        access_token: resolution.authSession.accessToken,
        refresh_token: resolution.authSession.refreshToken,
      });
      if (error) {
        logger.error("[appReturn] Failed to restore auth session", error);
      }
    } else if (resolution.authCode) {
      const { error } = await supabaseClient.auth.exchangeCodeForSession(
        resolution.authCode,
      );
      if (error) {
        logger.error("[appReturn] Failed to exchange auth code", error);
      }
    }
  } catch (error) {
    logger.error("[appReturn] Failed to process incoming app URL", error);
  }

  return resolution.route;
}

export function navigateToExternalUrl(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(url);
}

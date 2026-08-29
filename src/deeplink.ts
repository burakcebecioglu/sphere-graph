/** Read a focus node id from a URL search param (host-app deep linking). */
export function focusIdFromSearchParam(url: string | URL, param = "focus"): string | null {
  const parsed = typeof url === "string" ? new URL(url, "https://example.invalid") : url;
  return parsed.searchParams.get(param);
}

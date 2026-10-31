export function apiUrl(path) {
  const url = new URL(path, window.location.href);
  if (url.origin !== window.location.origin)
    throw new Error("The action must stay on this site.");
  return "/api/ui" + url.pathname + url.search;
}
export async function requestPage(
  path,
  { method = "GET", body, csrf, signal } = {},
) {
  const response = await fetch(apiUrl(path), {
    method,
    body,
    signal,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(method === "POST" ? { "X-CSRFToken": csrf } : {}),
    },
  });
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json"))
    throw new Error(
      "The server returned an unexpected response. Reload and try again.",
    );
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(result.error || "This action could not be completed."),
      { status: response.status },
    );
  return result;
}

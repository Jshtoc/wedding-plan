/**
 * Global fetch wrapper.
 *
 * - 401 Unauthorized → immediately redirects to /login (session expired).
 * - Any other non-ok response → parses the error message, dispatches
 *   "wwp:api-error" so the root ConfirmProvider can show it in the
 *   common alert modal, then throws so call sites can run cleanup.
 * - 2xx → returns the Response unchanged.
 */

export const API_ERROR_EVENT = "wwp:api-error";

export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, init);

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `오류가 발생했습니다 (HTTP ${res.status})`;
    try {
      const data = await res.clone().json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      // ignore parse failure — use default message
    }
    window.dispatchEvent(
      new CustomEvent(API_ERROR_EVENT, { detail: { message } })
    );
    throw new Error(message);
  }

  return res;
}

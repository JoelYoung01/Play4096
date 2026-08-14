/** Rewrite Expo/RN connection failures into a clear, actionable message. */
export function friendlyAuthNetworkError(message: string): string {
  // Already rewritten by AuthApiError / prior pass — keep host-specific wording.
  if (/^Could not reach /i.test(message)) {
    return message;
  }
  if (/could not connect|network request failed|fetch failed|timed?\s*out|network error/i.test(message)) {
    return "Could not reach the server. Check your connection and API URL, then try again.";
  }
  return message;
}

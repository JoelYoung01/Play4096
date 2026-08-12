/** Rewrite Expo/RN connection failures into a clear, actionable message. */
export function friendlyAuthNetworkError(message: string): string {
  if (/could not connect|network request failed|fetch failed|timed?\s*out/i.test(message)) {
    return "Could not reach the server. Check your connection and API URL, then try again.";
  }
  return message;
}

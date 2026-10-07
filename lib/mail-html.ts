export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function safeHtmlUrl(value: unknown) {
  if (typeof value !== "string" || /["'<>\\\s]/.test(value)) return "";
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      return "";
    return escapeHtml(url.href);
  } catch {
    return "";
  }
}

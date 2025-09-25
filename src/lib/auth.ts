export async function logoutAndRedirect() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  window.location.href = "/login";
}

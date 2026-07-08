// Auth utility functions for managing JWT tokens in localStorage

const TOKEN_KEY = "stokaj_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  const token = getToken()
  if (!token) return false
  try {
    // Decode payload to check expiry (JWT payload is base64url encoded)
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    // If token has exp claim and is expired, remove it
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      removeToken()
      return false
    }
    return true
  } catch {
    removeToken()
    return false
  }
}

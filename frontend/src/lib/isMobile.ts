import { headers } from "next/headers"

export async function isMobile() {
  const h = await headers()
  const ua = h.get("user-agent") || ""
  return /android|iphone|ipad|mobile/i.test(ua)
}

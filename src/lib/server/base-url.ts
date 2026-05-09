import { headers } from "next/headers";

export async function getBaseUrl() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";

  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${protocol}://${host}` : "http://localhost:3000")
  );
}

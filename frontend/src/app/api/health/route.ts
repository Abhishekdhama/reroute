import { backendBaseUrl, proxyToBackend } from "@/lib/server/backend";

export async function GET() {
  const upstream = await proxyToBackend("/health", { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  return Response.json({ ...payload, base_url: backendBaseUrl() }, { status: upstream.status });
}

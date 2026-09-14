import { proxyToBackend } from "@/lib/server/backend";

export async function POST(request: Request) {
  return proxyToBackend("/api/projects/reassess-after-reply", {
    method: "POST",
    body: await request.text(),
  });
}

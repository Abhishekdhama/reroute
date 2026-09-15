import { proxyUploadToBackend } from "@/lib/server/backend";

export async function POST(request: Request) {
  const formData = await request.formData();
  return proxyUploadToBackend("/api/projects/upload", formData);
}

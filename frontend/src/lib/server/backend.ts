const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

export function backendBaseUrl(): string {
  return (process.env.REROUTE_API_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

function withContext(body: string, status: number, path: string): string {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    return JSON.stringify({ ...parsed, base_url: backendBaseUrl(), upstream_status: status, path });
  } catch {
    return JSON.stringify({
      detail: body.slice(0, 300) || `Request failed with status ${status}.`,
      base_url: backendBaseUrl(),
      upstream_status: status,
      path,
    });
  }
}

/**
 * The FastAPI service ships without CORS middleware, so browser calls are proxied
 * through the Next server instead of changing backend behaviour.
 */
export async function proxyToBackend(path: string, init?: RequestInit): Promise<Response> {
  try {
    const upstream = await fetch(`${backendBaseUrl()}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const body = await upstream.text();
    return new Response(upstream.ok ? body : withContext(body, upstream.status, path), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return Response.json(
      {
        detail: "The Reroute API did not respond. Start it with: uvicorn main:app --reload",
        base_url: backendBaseUrl(),
        path,
      },
      { status: 503 },
    );
  }
}

/**
 * Same proxy, for a multipart file upload. The content-type (with its boundary)
 * must come from fetch itself, not be fixed to application/json like the JSON path.
 */
export async function proxyUploadToBackend(path: string, formData: FormData): Promise<Response> {
  try {
    const upstream = await fetch(`${backendBaseUrl()}${path}`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });
    const body = await upstream.text();
    return new Response(upstream.ok ? body : withContext(body, upstream.status, path), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return Response.json(
      {
        detail: "The Reroute API did not respond. Start it with: uvicorn main:app --reload",
        base_url: backendBaseUrl(),
        path,
      },
      { status: 503 },
    );
  }
}

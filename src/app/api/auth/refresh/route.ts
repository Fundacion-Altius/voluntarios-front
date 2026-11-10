import { type NextRequest, NextResponse } from "next/server";
import { copyUpstreamCookies } from "@/lib/copyUpstreamCookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      cookie: request.headers.get("cookie") || "",
      "X-Forwarded-Host": request.headers.get("host") || "",
    },
  });

  const data = await res.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: res.status });
  copyUpstreamCookies(res, response);
  return response;
}

import { NextResponse } from "next/server";
import { getRagContext } from "@/lib/tantraRag";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ context: "" });
    }
    const context = getRagContext(query);
    return NextResponse.json({ context });
  } catch {
    return NextResponse.json({ context: "" });
  }
}

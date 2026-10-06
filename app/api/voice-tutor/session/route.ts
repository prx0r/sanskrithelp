import { NextResponse } from "next/server";
import { buildTutorPrompt, type TutorWorldState } from "@/lib/voice-tutor/provider";

/**
 * POST { backend, worldState } -> session parameters for browser-direct WS.
 * DEV-ONLY while Qwen has no ephemeral tokens: requires QWEN_API_KEY +
 * QWEN_WORKSPACE_ID server-side, and the key's workspace URL is handed to
 * the browser. Production path is a server relay (not built yet).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const worldState = body?.worldState as TutorWorldState | undefined;
    const backend = body?.backend === "qwen" ? "qwen" : "qwen";
    if (!worldState) {
      return NextResponse.json({ error: "Missing worldState" }, { status: 400 });
    }
    const apiKey = process.env.QWEN_API_KEY;
    const workspace = process.env.QWEN_WORKSPACE_ID;
    if (!apiKey || !workspace) {
      return NextResponse.json(
        {
          error: "Voice tutor not configured",
          need: ["QWEN_API_KEY (Singapore region)", "QWEN_WORKSPACE_ID"],
          note: "Browser-direct connection exposes the key; use only for local dev. Production needs a server relay.",
        },
        { status: 503 }
      );
    }
    const prompt = buildTutorPrompt(worldState);
    const wsUrl = `wss://${workspace}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=qwen3.8-omni-flash-realtime`;
    return NextResponse.json({ backend, wsUrl, prompt, voice: "Tina" });
  } catch (error) {
    console.error("voice-tutor session error:", error);
    return NextResponse.json({ error: "session failed" }, { status: 500 });
  }
}

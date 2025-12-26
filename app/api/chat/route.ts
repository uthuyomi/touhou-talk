// app/api/chat/route.ts

/**
 * この API Route の役割
 * ---------------------
 * フロントエンド（ChatPane）から送られてきた
 * - キャラクターID
 * - 会話履歴
 * を受け取り、
 *
 * 1. 最新のユーザー発言を抽出
 * 2. Persona OS API に中継
 * 3. 返ってきた応答をそのまま返す
 *
 * ⚠️ このファイルでは：
 * - 人格プロンプトは組み立てない
 * - LLM / OpenAI API を直接触らない
 * - 会話状態・記憶は一切保持しない
 *
 * あくまで「API の窓口」専用レイヤー
 */

import { NextRequest, NextResponse } from "next/server";

/* =========================
   Persona OS API 設定
========================= */

/**
 * Persona OS 側の /chat エンドポイント
 * - 本番：Fly.io
 * - 開発：localhost
 */
const PERSONA_OS_ENDPOINT =
  process.env.PERSONA_OS_URL ?? "http://127.0.0.1:8000/chat";

/* =========================
   型定義
========================= */

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

type PersonaOsResponse = {
  reply: string;
};

/* =========================
   POST Handler
========================= */

/**
 * POST /api/chat
 *
 * 受け取る JSON：
 * {
 *   characterId: string,
 *   messages: { role: "user" | "ai", content: string }[]
 * }
 *
 * 返す JSON：
 * {
 *   role: "ai",
 *   content: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    /* =========================
       ① リクエストボディ取得
    ========================= */

    const body = await req.json();

    const {
      characterId,
      messages,
    }: {
      characterId: string;
      messages: ChatMessage[];
    } = body;

    /* =========================
       ② 入力バリデーション
    ========================= */

    if (!characterId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    /* =========================
       ③ 最新ユーザー発言の抽出
    ========================= */

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    /* =========================
       ④ Persona OS API に中継
    ========================= */

    const personaResponse = await fetch(PERSONA_OS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 将来：Cookie / localStorage / userId から差し替え可能
        session_id: "frontend-session",
        character_id: characterId,
        text: lastUserMessage.content,
      }),
    });

    if (!personaResponse.ok) {
      const text = await personaResponse.text();
      console.error("[Persona OS Error]", text);
      throw new Error("Persona OS API request failed");
    }

    const personaJson = (await personaResponse.json()) as PersonaOsResponse;

    /* =========================
       ⑤ FE 互換形式で返却
    ========================= */

    return NextResponse.json({
      role: "ai",
      content: personaJson.reply,
    });
  } catch (error) {
    /* =========================
       ⑥ エラーハンドリング
    ========================= */

    console.error("[/api/chat] Error:", error);

    return NextResponse.json(
      {
        role: "ai",
        content: "……少し調子が悪いみたい。時間をおいて試して。",
      },
      { status: 500 }
    );
  }
}

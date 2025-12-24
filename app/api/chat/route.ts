// app/api/chat/route.ts

/**
 * この API Route の役割
 * ---------------------
 * フロントエンド（ChatPane）から送られてきた
 * - キャラクターID
 * - 会話履歴
 * を受け取り、
 *
 * 1. characters.json から該当キャラを取得
 * 2. Chat 用の最小定義に変換
 * 3. lib/ai/chat.ts に処理を委譲
 * 4. GPT-5.2 の返答をそのまま返す
 *
 * ⚠️ このファイルでは：
 * - 人格プロンプトは組み立てない
 * - OpenAI API を直接触らない
 * - 会話状態・記憶は一切保持しない
 *
 * あくまで「API の窓口」専用レイヤー
 */

import { NextRequest, NextResponse } from "next/server";
import characters from "@/data/characters.json";
import {
  chatWithCharacter,
  ChatMessage,
  CharacterForChat,
} from "@/lib/ai/chat";

/* =========================
   内部型定義
   - characters.json のうち
     Chat に必要な部分のみ
========================= */

/**
 * characters.json の Chat 用最低構造
 * ※ UI 情報（色・背景）は含めない
 */
type CharacterJsonForChat = {
  id: string;
  name: string;
  title: string;
  prompt: {
    persona: string[];
    speech: string[];
    constraints: string[];
  };
};

type CharactersJsonMap = Record<string, CharacterJsonForChat>;

/* =========================
   型ガード
   - JSON を unknown から安全に扱う
========================= */

function isCharacterJsonForChat(value: unknown): value is CharacterJsonForChat {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;
  const p = v.prompt as Record<string, unknown> | undefined;

  const isStringArray = (x: unknown): x is string[] =>
    Array.isArray(x) && x.every((t) => typeof t === "string");

  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.title === "string" &&
    typeof p === "object" &&
    p !== null &&
    isStringArray(p.persona) &&
    isStringArray(p.speech) &&
    isStringArray(p.constraints)
  );
}

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
 */
export async function POST(req: NextRequest) {
  try {
    /* =========================
       ① リクエストボディ取得
    ========================= */

    // NextRequest.json() は async
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
       - 最低限のみチェック
    ========================= */

    if (!characterId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    /* =========================
       ③ キャラ定義取得
    ========================= */

    /**
     * characters.json は型が保証されないため
     * unknown → 型ガードで安全に確認する
     */
    const characterMap = characters as unknown as CharactersJsonMap;

    const candidate: unknown = characterMap[characterId];

    if (!isCharacterJsonForChat(candidate)) {
      return NextResponse.json(
        { error: "Character not found or invalid schema" },
        { status: 404 }
      );
    }

    /* =========================
       ④ Chat 用定義へ変換
    ========================= */

    /**
     * UI 情報・余分な設定は完全に切り捨てる
     * chat.ts は「人格と会話」だけを見る
     */
    const characterForChat: CharacterForChat = {
      id: candidate.id,
      name: candidate.name,
      title: candidate.title,
      system: {
        // buildPrompt.ts 側で使用
        world: "幻想郷",
        selfRecognition: `${candidate.name}として振る舞う`,
      },
      prompt: {
        persona: candidate.prompt.persona,
        speech: candidate.prompt.speech,
        constraints: candidate.prompt.constraints,
      },
    };

    /* =========================
       ⑤ GPT 呼び出し委譲
    ========================= */

    /**
     * OpenAI API は必ず chat.ts 経由
     * このファイルでは触らない
     */
    const reply = await chatWithCharacter(characterForChat, messages);

    /* =========================
       ⑥ レスポンス返却
    ========================= */

    return NextResponse.json({
      role: "ai",
      content: reply,
    });
  } catch (error) {
    /* =========================
       ⑦ エラーハンドリング
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

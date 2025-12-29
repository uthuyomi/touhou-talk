// app/api/group-chat/route.ts
//
// 🧠 グループチャット専用 API
// --------------------------------------------------
// 役割：
// - グループチャットの「次の発話」を生成する
// - 誰が喋るかはロジック（将来は AI）に委ねる
// - UI は speakerId を見て話者を表示する
//
// 注意：
// - 単体チャット (/api/chat) とは完全分離
// - この API は「1リクエスト = 1発話」
// - 履歴の管理は UI（親コンポーネント）側で行う
//

import { NextRequest, NextResponse } from "next/server";
import { GroupContext, initializeGroupContext } from "@/lib/chat/groupContext";

// ==================================================
// Request / Response 型
// ==================================================

/**
 * クライアントから送られてくる payload
 */
type GroupChatRequest = {
  /**
   * 現在のグループコンテキスト
   * - layer
   * - locationId
   * - participants
   * - history
   * - currentSpeakerId
   */
  context: GroupContext;

  /**
   * ユーザー入力
   * - グループ全体に向けた発話
   */
  userMessage: string;
};

/**
 * API が返すレスポンス
 *
 * ※ 現在は単発
 * ※ 将来は配列（複数発話）に拡張予定
 */
type GroupChatResponse = {
  role: "ai";
  speakerId: string;
  content: string;
};

// ==================================================
// POST handler
// ==================================================

export async function POST(req: NextRequest) {
  try {
    // ----------------------------------------------
    // 1. リクエストをパース
    // ----------------------------------------------
    const body = (await req.json()) as GroupChatRequest;
    const { context, userMessage } = body;

    if (!context || !context.enabled) {
      return NextResponse.json(
        {
          error: "Group context is not enabled",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------
    // 2. グループ初期化（非破壊）
    // - 初回なら話者を決定
    // - init メッセージを内部的に用意
    // ----------------------------------------------
    const initialized = initializeGroupContext(context);

    // ----------------------------------------------
    // 3. 今回の話者を決定
    //
    // 現段階：
    // - currentSpeakerId をそのまま使用
    //
    // 将来：
    // - history + userMessage を元に
    //   「誰が反応するか」を AI に委ねる
    // ----------------------------------------------
    const speakerId = initialized.currentSpeakerId;

    if (!speakerId) {
      return NextResponse.json(
        {
          error: "No speaker available",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------
    // 4. 仮の AI 応答生成
    //
    // ※ ここは後で LLM 呼び出しに置き換える
    // ----------------------------------------------
    const aiContent = `……${userMessage}か。少し考えさせてくれ。`;

    // ----------------------------------------------
    // 5. レスポンス生成（UI が期待する最小形）
    // ----------------------------------------------
    const response: GroupChatResponse = {
      role: "ai",
      speakerId,
      content: aiContent,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[group-chat] error:", err);

    return NextResponse.json(
      {
        role: "ai",
        speakerId: "system",
        content: "……場の空気が乱れている。少し待ってくれ。",
      },
      { status: 500 }
    );
  }
}

// app/api/group-chat/route.ts
//
// 🧠 グループチャット専用 API
// --------------------------------------------------
// 役割：
// - UI → persona-core (Fly.io) の橋渡し
// - グループチャットの次の発話を取得する
//
// 注意：
// - GroupContext の中身には最小限しか依存しない
// - 状態管理・話者決定は persona-core 側が唯一の正本
//

import { NextRequest, NextResponse } from "next/server";
import { GroupContext } from "@/lib/chat/groupContext";

// ==================================================
// Request / Response 型
// ==================================================

type GroupChatRequest = {
  context: GroupContext;
  userMessage: string;
};

type GroupChatResponse = {
  role: "ai";
  speakerId: string;
  content: string;
};

// ==================================================
// 内部補助型（any 回避）
// ==================================================

type ParticipantLike =
  | string
  | {
      id: string;
    };

type GroupContextWithParticipants = GroupContext & {
  participants?: ParticipantLike[];
};

// ==================================================
// persona-core (Fly.io)
// ★ group-chat 専用 URL をそのまま使う
// ==================================================

const PERSONA_CORE_GROUP_URL =
  process.env.PERSONA_OS_GROUP_URL ??
  "https://touhou-talk-core.fly.dev/group-chat";

// ==================================================
// POST handler
// ==================================================

export async function POST(req: NextRequest) {
  try {
    // ----------------------------------------------
    // 1. parse request
    // ----------------------------------------------
    const body = (await req.json()) as GroupChatRequest;
    const { context, userMessage } = body;

    // GroupContext は enabled のみ確認
    if (!context || !context.enabled) {
      return NextResponse.json(
        { error: "Group context is not enabled" },
        { status: 400 }
      );
    }

    // ----------------------------------------------
    // participants を安全に抽出（any 不使用）
    // ----------------------------------------------
    const ctx = context as GroupContextWithParticipants;

    const participants: string[] = Array.isArray(ctx.participants)
      ? ctx.participants.map((p) => (typeof p === "string" ? p : p.id))
      : [];

    if (participants.length === 0) {
      return NextResponse.json(
        { error: "No participants provided" },
        { status: 400 }
      );
    }

    // ----------------------------------------------
    // 2. persona-core へ転送
    // ----------------------------------------------
    const payload = {
      session_id: "ui-group-session",
      group_id: "ui-group",
      participants,
      user_text: userMessage,
      client_state: {},
    };

    const res = await fetch(PERSONA_CORE_GROUP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`persona-core error: ${text}`);
    }

    const data = await res.json();

    // ----------------------------------------------
    // 3. UI が期待する最小形に変換
    // ----------------------------------------------
    const first = data?.utterances?.[0];

    if (!first) {
      return NextResponse.json({
        role: "ai",
        speakerId: "system",
        content: "……誰も反応しなかった。",
      });
    }

    const response: GroupChatResponse = {
      role: "ai",
      speakerId: first.speaker_id,
      content: first.content,
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

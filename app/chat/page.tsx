// app/chat/page.tsx
"use client";

/**
 * /chat は URL クエリ依存・ユーザー操作前提のため
 * 静的プリレンダリングを禁止する
 */
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import ChatPane from "@/components/ChatPane";
import CharacterPanel from "@/components/CharacterPanel";
import { CHARACTERS } from "@/data/characters";

/* =========================
   Types
========================= */

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function ChatPage() {
  const searchParams = useSearchParams();

  /* =========================
     URL params
  ========================= */

  const layer = searchParams.get("layer") ?? undefined;
  const currentLocationId = searchParams.get("loc") ?? undefined;
  const initialCharacterId = searchParams.get("char");

  /* =========================
     キャラ選択 state
  ========================= */

  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    () =>
      initialCharacterId && CHARACTERS[initialCharacterId]
        ? initialCharacterId
        : null
  );

  /* =========================
     メッセージ state
  ========================= */

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "ai",
      content: "……誰かが、こちらを見ている。",
    },
  ]);

  /* =========================
     activeCharacter 解決
  ========================= */

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return CHARACTERS[activeCharacterId] ?? null;
  }, [activeCharacterId]);

  /* =========================
     メッセージ操作
  ========================= */

  const handleSend = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
      },
    ]);
  }, []);

  const handleAiMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        content,
      },
    ]);
  }, []);

  const handleOpenPanel = useCallback(() => {
    // モバイル用：将来拡張用フック
  }, []);

  /* ========================= */

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* =========================
          キャラクター選択
         ========================= */}
      <CharacterPanel
        characters={CHARACTERS}
        activeId={activeCharacterId ?? ""}
        onSelect={setActiveCharacterId}
        currentLocationId={currentLocationId}
        currentLayer={layer ?? null}
      />

      {/* =========================
          チャット本体
         ========================= */}
      {activeCharacter ? (
        <ChatPane
          character={activeCharacter}
          messages={messages}
          onSend={handleSend}
          onAiMessage={handleAiMessage}
          onOpenPanel={handleOpenPanel}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-white/40">
          マップからキャラクターを選択してください
        </div>
      )}
    </div>
  );
}

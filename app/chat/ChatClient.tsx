"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import ChatPane from "@/components/ChatPane";
import CharacterPanel from "@/components/CharacterPanel";
import { CHARACTERS } from "@/data/characters";
import { cn } from "@/lib/utils";

/* =========================
   Types
========================= */

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

/* =========================
   Component
========================= */

export default function ChatClient() {
  const searchParams = useSearchParams();

  const currentLayer = searchParams.get("layer");
  const currentLocationId = searchParams.get("loc");
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
     モバイル用：パネル開閉
  ========================= */

  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
      { id: crypto.randomUUID(), role: "user", content },
    ]);
  }, []);

  const handleAiMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "ai", content },
    ]);
  }, []);

  /* ========================= */

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* =========================
          モバイル：スライドキャラパネル
         ========================= */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:hidden",
          isPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <CharacterPanel
          characters={CHARACTERS}
          activeId={activeCharacterId ?? ""}
          onSelect={(id) => {
            setActiveCharacterId(id);
            setIsPanelOpen(false); // ← 選択したら閉じる
          }}
          currentLocationId={currentLocationId}
          currentLayer={currentLayer}
        />
      </div>

      {/* モバイル：背景オーバーレイ */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* =========================
          PC：常時表示キャラパネル
         ========================= */}
      <div className="hidden lg:block">
        <CharacterPanel
          characters={CHARACTERS}
          activeId={activeCharacterId ?? ""}
          onSelect={setActiveCharacterId}
          currentLocationId={currentLocationId}
          currentLayer={currentLayer}
        />
      </div>

      {/* =========================
          チャット本体
         ========================= */}
      {activeCharacter ? (
        <ChatPane
          character={activeCharacter}
          messages={messages}
          onSend={handleSend}
          onAiMessage={handleAiMessage}
          onOpenPanel={() => setIsPanelOpen(true)} // ← ★ここが本丸
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-white/40">
          マップからキャラクターを選択してください
        </div>
      )}
    </div>
  );
}

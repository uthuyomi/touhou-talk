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
     キャラ別チャット履歴
  ========================= */

  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(
    () => {
      const initial: Record<string, Message[]> = {};
      Object.keys(CHARACTERS).forEach((id) => {
        initial[id] = [
          {
            id: "init",
            role: "ai",
            content: "……誰かが、こちらを見ている。",
          },
        ];
      });
      return initial;
    }
  );

  /* =========================
     activeCharacter 解決
  ========================= */

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return CHARACTERS[activeCharacterId] ?? null;
  }, [activeCharacterId]);

  /* =========================
     表示用メッセージ
  ========================= */

  const messages = useMemo(() => {
    if (!activeCharacterId) return [];
    return chatHistories[activeCharacterId] ?? [];
  }, [chatHistories, activeCharacterId]);

  /* =========================
     メッセージ操作
  ========================= */

  const handleSend = useCallback(
    (content: string) => {
      if (!activeCharacterId) return;
      setChatHistories((prev) => ({
        ...prev,
        [activeCharacterId]: [
          ...prev[activeCharacterId],
          { id: crypto.randomUUID(), role: "user", content },
        ],
      }));
    },
    [activeCharacterId]
  );

  const handleAiMessage = useCallback(
    (content: string) => {
      if (!activeCharacterId) return;
      setChatHistories((prev) => ({
        ...prev,
        [activeCharacterId]: [
          ...prev[activeCharacterId],
          { id: crypto.randomUUID(), role: "ai", content },
        ],
      }));
    },
    [activeCharacterId]
  );

  /* =========================
     Mobile 判定（SSR安全）
  ========================= */

  const [isMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  const isCharacterSelected = Boolean(activeCharacterId);

  /* ========================= */

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* =========================
          モバイル初回：完全フルスクリーン
         ========================= */}
      {isMobile && !isCharacterSelected && (
        <div className="fixed inset-0 z-50">
          {/* CharacterPanel の w-72 を強制上書き */}
          <div className="[&_.gensou-sidebar]:w-full [&_.gensou-sidebar]:max-w-none h-full w-full">
            <CharacterPanel
              characters={CHARACTERS}
              activeId=""
              onSelect={(id) => {
                setActiveCharacterId(id);
                setIsPanelOpen(false);
              }}
              currentLocationId={currentLocationId}
              currentLayer={currentLayer}
            />
          </div>
        </div>
      )}

      {/* =========================
          モバイル：再オープン時
         ========================= */}
      {isMobile && isCharacterSelected && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-50 transition-transform duration-300",
              isPanelOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="[&_.gensou-sidebar]:w-full [&_.gensou-sidebar]:max-w-none h-full w-full">
              <CharacterPanel
                characters={CHARACTERS}
                activeId={activeCharacterId ?? ""}
                onSelect={(id) => {
                  setActiveCharacterId(id);
                  setIsPanelOpen(false);
                }}
                currentLocationId={currentLocationId}
                currentLayer={currentLayer}
              />
            </div>
          </div>

          {isPanelOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsPanelOpen(false)}
            />
          )}
        </>
      )}

      {/* =========================
          PC
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
      {activeCharacter && (
        <ChatPane
          character={activeCharacter}
          messages={messages}
          onSend={handleSend}
          onAiMessage={handleAiMessage}
          onOpenPanel={() => setIsPanelOpen(true)}
        />
      )}
    </div>
  );
}

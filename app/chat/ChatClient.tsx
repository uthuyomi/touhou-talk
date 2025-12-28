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
     ★ 初回選択済みフラグ（ここが肝）
  ========================= */

  const [hasSelectedOnce, setHasSelectedOnce] = useState<boolean>(
    Boolean(initialCharacterId)
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
          モバイル初回：完全フルスクリーン（1回だけ）
         ========================= */}
      {isMobile && !hasSelectedOnce && !isCharacterSelected && (
        <div className="fixed inset-0 z-50">
          <div className="[&_.gensou-sidebar]:w-full [&_.gensou-sidebar]:max-w-none h-full w-full">
            <CharacterPanel
              characters={CHARACTERS}
              activeId=""
              onSelect={(id) => {
                setActiveCharacterId(id);
                setHasSelectedOnce(true); // ★ ここで確定
                setIsPanelOpen(false);
              }}
              currentLocationId={currentLocationId}
              currentLayer={currentLayer}
            />
          </div>
        </div>
      )}

      {/* =========================
          モバイル：再オープン時（スライド）
         ========================= */}
      {isMobile && hasSelectedOnce && (
        <>
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300",
              isPanelOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
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

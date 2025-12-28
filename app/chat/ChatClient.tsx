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

  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

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
          ...(prev[activeCharacterId] ?? []),
          {
            id: crypto.randomUUID(),
            role: "user",
            content,
          },
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
          ...(prev[activeCharacterId] ?? []),
          {
            id: crypto.randomUUID(),
            role: "ai",
            content,
          },
        ],
      }));
    },
    [activeCharacterId]
  );

  /* =========================
     判定
     - hydration差を避けるため、ここは "初回はPC扱い" に倒してOK
       （モバイル判定はクライアント実行後に正しくなる）
  ========================= */

  const [isMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // SSR/ビルド時は false
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  const isCharacterSelected = Boolean(activeCharacterId);

  /* ========================= */

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* =========================
          モバイル初回：全面キャラ選択
          - ここでは「閉じる」概念を持たせない（詰み防止）
         ========================= */}
      {isMobile && !isCharacterSelected && (
        <div className="fixed inset-0 z-50">
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
      )}

      {/* =========================
          モバイル：スライドキャラパネル
         ========================= */}
      {isMobile && isCharacterSelected && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-50 transition-transform duration-300",
              isPanelOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* ★ 画面いっぱいにする（縦横全面） */}
            <div className="h-dvh w-full">
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

          {/* ★ オーバーレイは「閉じる」用途だけど、誤タップ対策として
              “初回選択済み” のときだけ有効（ここは選択済みなのでOK） */}
          {isPanelOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsPanelOpen(false)}
            />
          )}
        </>
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

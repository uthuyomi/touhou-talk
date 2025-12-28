"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import ChatPane from "@/components/ChatPane";
import CharacterPanel from "@/components/CharacterPanel";
import { CHARACTERS } from "@/data/characters";
import { cn } from "@/lib/utils";

/* ★ 正規：グループ定義 */
import { getGroupsByLocation, canEnableGroup, GroupDef } from "@/data/group";

/* =========================
   Types
========================= */

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

/** CharacterPanel に渡す最小 groupContext */
type GroupContext = {
  enabled: boolean;
  label: string;
  group: GroupDef;
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

  const [hasSelectedOnce, setHasSelectedOnce] = useState<boolean>(
    Boolean(initialCharacterId)
  );

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
     activeCharacter
  ========================= */

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return CHARACTERS[activeCharacterId] ?? null;
  }, [activeCharacterId]);

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
     Mobile 判定
  ========================= */

  const [isMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  const isCharacterSelected = Boolean(activeCharacterId);

  /* =========================
     ★ グループチャット文脈（正規）
  ========================= */

  const groupContext = useMemo<GroupContext | null>(() => {
    if (!currentLayer || !currentLocationId) return null;

    const groups = getGroupsByLocation(currentLayer, currentLocationId);
    if (groups.length === 0) return null;

    const group = groups[0]; // 1ロケーション1グループ前提
    if (!canEnableGroup(group.id)) return null;

    return {
      enabled: true,
      label: group.ui.label,
      group,
    };
  }, [currentLayer, currentLocationId]);

  /* ========================= */

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* =========================
          モバイル初回
         ========================= */}
      {isMobile && !hasSelectedOnce && !isCharacterSelected && (
        <div className="fixed inset-0 z-50">
          <div className="[&_.gensou-sidebar]:w-full [&_.gensou-sidebar]:max-w-none h-full w-full">
            <CharacterPanel
              characters={CHARACTERS}
              activeId=""
              onSelect={(id) => {
                setActiveCharacterId(id);
                setHasSelectedOnce(true);
                setIsPanelOpen(false);
              }}
              currentLocationId={currentLocationId}
              currentLayer={currentLayer}
              groupContext={groupContext}
              onStartGroup={() => {
                console.log("start group chat", groupContext);
              }}
            />
          </div>
        </div>
      )}

      {/* =========================
          モバイル再オープン
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
              groupContext={groupContext}
              onStartGroup={() => {
                console.log("start group chat", groupContext);
              }}
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
          groupContext={groupContext}
          onStartGroup={() => {
            console.log("start group chat", groupContext);
          }}
        />
      </div>

      {/* =========================
          単体チャット
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

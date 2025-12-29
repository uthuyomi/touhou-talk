"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChatPane from "@/components/ChatPane";
import CharacterPanel from "@/components/CharacterPanel";
import { CHARACTERS } from "@/data/characters";
import { getGroupsByLocation, canEnableGroup, GroupDef } from "@/data/group";

/* =========================
   Types
========================= */

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  speakerId?: string;
};

type PanelGroupContext = {
  enabled: boolean;
  label: string;
  group: GroupDef;
};

type ChatGroupContext = {
  enabled: boolean;
  label: string;
  ui: {
    chatBackground?: string;
    accent?: string;
  };
  participants: Array<{
    id: string;
    name: string;
    title: string;
    ui: {
      chatBackground?: string | null;
      placeholder: string;
    };
    color?: {
      accent?: string;
    };
  }>;
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
     状態
  ========================= */

  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    initialCharacterId && CHARACTERS[initialCharacterId]
      ? initialCharacterId
      : null
  );

  const [mode, setMode] = useState<"single" | "group">("single");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hasSelectedOnce, setHasSelectedOnce] = useState(
    Boolean(initialCharacterId)
  );

  const activeIdForPanel = useMemo(() => {
    if (mode === "group") return "__group__";
    return activeCharacterId ?? "";
  }, [mode, activeCharacterId]);

  /* =========================
     ★ Mobile / Tablet 判定（< lg）
  ========================= */

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* =========================
     履歴
  ========================= */

  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(
    () => {
      const initial: Record<string, Message[]> = {};
      Object.keys(CHARACTERS).forEach((id) => {
        initial[id] = [
          { id: "init", role: "ai", content: "……誰かが、こちらを見ている。" },
        ];
      });
      return initial;
    }
  );

  const [groupHistories, setGroupHistories] = useState<
    Record<string, Message[]>
  >({});

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return CHARACTERS[activeCharacterId] ?? null;
  }, [activeCharacterId]);

  /* =========================
     グループ文脈
  ========================= */

  const panelGroupContext = useMemo<PanelGroupContext | null>(() => {
    if (!currentLayer || !currentLocationId) return null;
    const groups = getGroupsByLocation(currentLayer, currentLocationId);
    if (!groups.length) return null;
    const group = groups[0];
    if (!canEnableGroup(group.id)) return null;
    return { enabled: true, label: group.ui.label, group };
  }, [currentLayer, currentLocationId]);

  const chatGroupContext = useMemo<ChatGroupContext | null>(() => {
    if (!panelGroupContext?.enabled) return null;

    const participants = panelGroupContext.group.participants
      .map((id) => CHARACTERS[id])
      .filter(Boolean);

    const groupUi = panelGroupContext.group.ui as unknown as {
      chatBackground?: string | null;
      accent?: string;
    };

    return {
      enabled: true,
      label: panelGroupContext.group.ui.label,
      ui: {
        chatBackground: groupUi.chatBackground ?? undefined,
        accent: groupUi.accent,
      },
      participants,
    };
  }, [panelGroupContext]);

  /* =========================
     メッセージ処理
  ========================= */

  const handleSend = useCallback(
    (content: string) => {
      if (mode === "group") {
        if (!currentLocationId) return;
        setGroupHistories((prev) => ({
          ...prev,
          [currentLocationId]: [
            ...(prev[currentLocationId] ?? []),
            { id: crypto.randomUUID(), role: "user", content },
          ],
        }));
        return;
      }

      if (!activeCharacterId) return;
      setChatHistories((prev) => ({
        ...prev,
        [activeCharacterId]: [
          ...(prev[activeCharacterId] ?? []),
          { id: crypto.randomUUID(), role: "user", content },
        ],
      }));
    },
    [mode, currentLocationId, activeCharacterId]
  );

  const handleAiMessage = useCallback(
    (content: string, speakerId?: string) => {
      const msg: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        content,
        speakerId,
      };

      if (mode === "group") {
        if (!currentLocationId) return;
        setGroupHistories((prev) => ({
          ...prev,
          [currentLocationId]: [...(prev[currentLocationId] ?? []), msg],
        }));
        return;
      }

      if (!activeCharacterId) return;
      setChatHistories((prev) => ({
        ...prev,
        [activeCharacterId]: [...(prev[activeCharacterId] ?? []), msg],
      }));
    },
    [mode, currentLocationId, activeCharacterId]
  );

  /* ========================= */

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* ===== Mobile / Tablet 初回：キャラ未選択なら全画面パネル ===== */}
      {isMobile && !hasSelectedOnce && !activeCharacterId && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <CharacterPanel
            characters={CHARACTERS}
            activeId={activeIdForPanel}
            onSelect={(id) => {
              setActiveCharacterId(id);
              setMode("single");
              setHasSelectedOnce(true);
              setIsPanelOpen(false);
            }}
            currentLocationId={currentLocationId}
            currentLayer={currentLayer}
            groupContext={panelGroupContext}
            onStartGroup={() => {
              if (!currentLocationId) return;
              setMode("group");
              setHasSelectedOnce(true);
              setIsPanelOpen(false);
              setGroupHistories((prev) => {
                if (prev[currentLocationId]?.length) return prev;
                return {
                  ...prev,
                  [currentLocationId]: [
                    {
                      id: "init",
                      role: "ai",
                      content: "……場が、静かに立ち上がる。",
                    },
                  ],
                };
              });
            }}
            mode={mode}
            fullScreen
          />
        </div>
      )}

      {/* ===== Desktop ===== */}
      <div className="hidden lg:block">
        <CharacterPanel
          characters={CHARACTERS}
          activeId={activeIdForPanel}
          onSelect={(id) => {
            setActiveCharacterId(id);
            setMode("single");
            setHasSelectedOnce(true);
          }}
          currentLocationId={currentLocationId}
          currentLayer={currentLayer}
          groupContext={panelGroupContext}
          onStartGroup={() => {
            if (!currentLocationId) return;
            setMode("group");
            setHasSelectedOnce(true);
            setGroupHistories((prev) => {
              if (prev[currentLocationId]?.length) return prev;
              return {
                ...prev,
                [currentLocationId]: [
                  {
                    id: "init",
                    role: "ai",
                    content: "……場が、静かに立ち上がる。",
                  },
                ],
              };
            });
          }}
          mode={mode}
        />
      </div>

      {/* ===== Mobile Panel ===== */}
      {isPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsPanelOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-80 lg:hidden">
            <CharacterPanel
              characters={CHARACTERS}
              activeId={activeIdForPanel}
              onSelect={(id) => {
                setActiveCharacterId(id);
                setMode("single");
                setHasSelectedOnce(true);
                setIsPanelOpen(false);
              }}
              currentLocationId={currentLocationId}
              currentLayer={currentLayer}
              groupContext={panelGroupContext}
              onStartGroup={() => {
                if (!currentLocationId) return;
                setMode("group");
                setHasSelectedOnce(true);
                setIsPanelOpen(false);
                setGroupHistories((prev) => {
                  if (prev[currentLocationId]?.length) return prev;
                  return {
                    ...prev,
                    [currentLocationId]: [
                      {
                        id: "init",
                        role: "ai",
                        content: "……場が、静かに立ち上がる。",
                      },
                    ],
                  };
                });
              }}
              mode={mode}
            />
          </div>
        </>
      )}

      {/* ===== Chat ===== */}
      {activeCharacter && (
        <ChatPane
          character={activeCharacter}
          messages={
            mode === "group" && currentLocationId
              ? groupHistories[currentLocationId] ?? []
              : activeCharacterId
              ? chatHistories[activeCharacterId] ?? []
              : []
          }
          onSend={handleSend}
          onAiMessage={handleAiMessage}
          onOpenPanel={() => setIsPanelOpen(true)}
          mode={mode}
          groupContext={mode === "group" ? chatGroupContext : null}
        />
      )}
    </div>
  );
}
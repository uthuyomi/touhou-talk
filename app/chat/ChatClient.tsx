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

  /** ★ グループ用：誰が喋ったか（ChatPane と整合） */
  speakerId?: string;
};

/** CharacterPanel に渡す最小 groupContext */
type PanelGroupContext = {
  enabled: boolean;
  label: string;
  group: GroupDef;
};

/** ChatPane に渡す最小 groupContext（ChatPane と整合） */
type ChatGroupContext = {
  enabled: boolean;
  label: string;
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
     ★ モード（単体 / グループ）
  ========================= */

  const [mode, setMode] = useState<"single" | "group">("single");

  /* =========================
     キャラ別チャット履歴（単体）
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
     ★ グループチャット履歴（場所ごと）
     - 現段階は「1ロケーション1グループ」前提なので locationId キーで持つ
  ========================= */

  const [groupHistories, setGroupHistories] = useState<
    Record<string, Message[]>
  >(() => ({}));

  /* =========================
     activeCharacter
  ========================= */

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return CHARACTERS[activeCharacterId] ?? null;
  }, [activeCharacterId]);

  /* =========================
     ★ グループチャット文脈（CharacterPanel 用 / 正規）
  ========================= */

  const panelGroupContext = useMemo<PanelGroupContext | null>(() => {
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

  /* =========================
     ★ グループチャット文脈（ChatPane 用 / participants 実体化）
  ========================= */

  const chatGroupContext = useMemo<ChatGroupContext | null>(() => {
    if (!panelGroupContext?.enabled) return null;

    const participants = panelGroupContext.group.participants
      .map((id) => CHARACTERS[id])
      .filter(Boolean);

    return {
      enabled: true,
      label: panelGroupContext.group.ui.label,
      participants,
    };
  }, [panelGroupContext]);

  /* =========================
     表示用メッセージ
     - single: 選択キャラの履歴
     - group : 現ロケーションの履歴
  ========================= */

  const messages = useMemo(() => {
    if (mode === "group") {
      if (!currentLocationId) return [];
      return groupHistories[currentLocationId] ?? [];
    }

    if (!activeCharacterId) return [];
    return chatHistories[activeCharacterId] ?? [];
  }, [mode, groupHistories, currentLocationId, chatHistories, activeCharacterId]);

  /* =========================
     メッセージ操作
  ========================= */

  const handleSend = useCallback(
    (content: string) => {
      // group
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

      // single
      if (!activeCharacterId) return;
      setChatHistories((prev) => ({
        ...prev,
        [activeCharacterId]: [
          ...prev[activeCharacterId],
          { id: crypto.randomUUID(), role: "user", content },
        ],
      }));
    },
    [mode, currentLocationId, activeCharacterId]
  );

  /**
   * ✅ 修正点：
   * ChatPane の onAiMessage は (content: string) => void
   * なのでここも string を受け取り、Message をこの中で生成して state に積む。
   * （speakerId は今は ChatPane 側で保持/表示してるだけなので、現段階では触らない）
   */
  const handleAiMessage = useCallback(
    (content: string) => {
      const msg: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        content,
      };

      // group
      if (mode === "group") {
        if (!currentLocationId) return;

        setGroupHistories((prev) => ({
          ...prev,
          [currentLocationId]: [...(prev[currentLocationId] ?? []), msg],
        }));
        return;
      }

      // single
      if (!activeCharacterId) return;
      setChatHistories((prev) => ({
        ...prev,
        [activeCharacterId]: [...prev[activeCharacterId], msg],
      }));
    },
    [mode, currentLocationId, activeCharacterId]
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
     ★ グループ開始（UIは今のまま / モードだけ切替）
  ========================= */

  const startGroupChat = useCallback(() => {
    if (!panelGroupContext?.enabled) return;
    if (!currentLocationId) return;

    setMode("group");

    // グループ側が初回なら、空でも良いが「init」を入れたいならここで入れる
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

    // パネル操作
    setHasSelectedOnce(true);
    setIsPanelOpen(false);
  }, [panelGroupContext, currentLocationId]);

  /* =========================
     ★ 単体に戻す（キャラ選択時に自動で戻す）
  ========================= */

  const selectCharacter = useCallback((id: string) => {
    setActiveCharacterId(id);
    setMode("single");
    setHasSelectedOnce(true);
    setIsPanelOpen(false);
  }, []);

  /* =========================
     ChatPane に渡す “キャラ”
     - group でも placeholder が必要なので、参加者の先頭 or 現在選択キャラを使う
  ========================= */

  const chatPaneCharacter = useMemo(() => {
    if (mode !== "group") return activeCharacter;

    const first =
      chatGroupContext?.participants && chatGroupContext.participants[0]
        ? chatGroupContext.participants[0]
        : null;

    return first ?? activeCharacter;
  }, [mode, chatGroupContext, activeCharacter]);

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
                selectCharacter(id);
              }}
              currentLocationId={currentLocationId}
              currentLayer={currentLayer}
              groupContext={panelGroupContext}
              onStartGroup={startGroupChat}
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
                selectCharacter(id);
              }}
              currentLocationId={currentLocationId}
              currentLayer={currentLayer}
              groupContext={panelGroupContext}
              onStartGroup={startGroupChat}
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
          onSelect={(id) => {
            // CharacterPanel の onSelect シグネチャに合わせる
            selectCharacter(id);
          }}
          currentLocationId={currentLocationId}
          currentLayer={currentLayer}
          groupContext={panelGroupContext}
          onStartGroup={startGroupChat}
        />
      </div>

      {/* =========================
          チャット
         ========================= */}
      {chatPaneCharacter && (
        <ChatPane
          character={chatPaneCharacter}
          messages={messages}
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
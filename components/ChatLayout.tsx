"use client";

import { useState, useMemo } from "react";
import characters from "@/data/characters.json";
import CharacterPanel from "@/components/CharacterPanel";
import ChatPane from "@/components/ChatPane";
import { cn } from "@/lib/utils";
import { buildGroupContext } from "@/lib/chat/groupContext";

type CharacterId = keyof typeof characters;

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function ChatLayout() {
  /* =========================
     固定ロケーション（簡易対応）
  ========================= */
  const currentLayer = "gensokyo";
  const currentLocationId = "hakurei_shrine";

  /* =========================
     グループコンテキスト
  ========================= */
  const groupContext = useMemo(
    () =>
      buildGroupContext({
        layer: currentLayer,
        locationId: currentLocationId,
      }),
    [currentLayer, currentLocationId]
  );

  const handleStartGroup = () => {
    console.log("Group chat start", groupContext);
  };

  /* ========================= */

  const [activeCharacterId, setActiveCharacterId] =
    useState<CharacterId>("reimu");

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const character = characters[activeCharacterId];

  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(
    () => {
      const initial: Record<string, Message[]> = {};
      Object.values(characters).forEach((char) => {
        initial[char.id] = [];
      });
      return initial;
    }
  );

  const messages = chatHistories[character.id] ?? [];

  const sendMessage = (content: string) => {
    setChatHistories((prev) => ({
      ...prev,
      [character.id]: [
        ...(prev[character.id] ?? []),
        { id: crypto.randomUUID(), role: "user", content },
      ],
    }));
  };

  const appendAiMessage = (content: string) => {
    setChatHistories((prev) => ({
      ...prev,
      [character.id]: [
        ...(prev[character.id] ?? []),
        { id: crypto.randomUUID(), role: "ai", content },
      ],
    }));
  };

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* モバイル */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform lg:hidden",
          isPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <CharacterPanel
          characters={characters}
          activeId={activeCharacterId}
          onSelect={(id) => {
            setActiveCharacterId(id as CharacterId);
            setIsPanelOpen(false);
          }}
          currentLayer={currentLayer}
          currentLocationId={currentLocationId}
          groupContext={groupContext}
          onStartGroup={handleStartGroup}
        />
      </div>

      {isPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* PC */}
      <div className="hidden lg:block">
        <CharacterPanel
          characters={characters}
          activeId={activeCharacterId}
          onSelect={(id) => setActiveCharacterId(id as CharacterId)}
          currentLayer={currentLayer}
          currentLocationId={currentLocationId}
          groupContext={groupContext}
          onStartGroup={handleStartGroup}
        />
      </div>

      <ChatPane
        character={character}
        messages={messages}
        onSend={sendMessage}
        onAiMessage={appendAiMessage}
        onOpenPanel={() => setIsPanelOpen(true)}
      />
    </div>
  );
}

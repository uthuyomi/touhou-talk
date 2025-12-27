// app/chat/ChatClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import ChatPane from "@/components/ChatPane";
import CharacterPanel from "@/components/CharacterPanel";
import { CHARACTERS } from "@/data/characters";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function ChatClient() {
  const searchParams = useSearchParams();

  const currentLayer = searchParams.get("layer");
  const currentLocationId = searchParams.get("loc");
  const initialCharacterId = searchParams.get("char");

  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    () =>
      initialCharacterId && CHARACTERS[initialCharacterId]
        ? initialCharacterId
        : null
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "ai",
      content: "……誰かが、こちらを見ている。",
    },
  ]);

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return CHARACTERS[activeCharacterId] ?? null;
  }, [activeCharacterId]);

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

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      <CharacterPanel
        characters={CHARACTERS}
        activeId={activeCharacterId ?? ""}
        onSelect={setActiveCharacterId}
        currentLocationId={currentLocationId}
        currentLayer={currentLayer}
      />

      {activeCharacter ? (
        <ChatPane
          character={activeCharacter}
          messages={messages}
          onSend={handleSend}
          onAiMessage={handleAiMessage}
          onOpenPanel={() => {}}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-white/40">
          マップからキャラクターを選択してください
        </div>
      )}
    </div>
  );
}

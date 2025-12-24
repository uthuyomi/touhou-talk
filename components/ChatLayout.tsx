"use client";

import { useState } from "react";
import characters from "@/data/characters.json";
import CharacterPanel from "@/components/CharacterPanel";
import ChatPane from "@/components/ChatPane";
import { cn } from "@/lib/utils";

type CharacterId = keyof typeof characters;

/**
 * Message 型
 * ChatPane と共有
 */
type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function ChatLayout() {
  /**
   * 現在選択中のキャラ
   */
  const [activeCharacterId, setActiveCharacterId] =
    useState<CharacterId>("reimu");

  /**
   * モバイル用：キャラパネル開閉
   * ※ PC では常に open 扱い
   */
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const character = characters[activeCharacterId];

  /**
   * キャラ別の会話履歴
   */
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(
    () => {
      const initial: Record<string, Message[]> = {};

      Object.values(characters).forEach((char) => {
        initial[char.id] = [
          {
            id: "init",
            role: "ai",
            content: char.system.initialMessage,
          },
        ];
      });

      return initial;
    }
  );

  /**
   * 現在キャラのメッセージ
   */
  const messages = chatHistories[character.id] ?? [];

  /**
   * ユーザー送信
   */
  const sendMessage = (content: string) => {
    setChatHistories((prev) => {
      const prevMessages = prev[character.id] ?? [];

      return {
        ...prev,
        [character.id]: [
          ...prevMessages,
          {
            id: crypto.randomUUID(),
            role: "user",
            content,
          },
        ],
      };
    });
  };

  /**
   * AI 返信追加
   */
  const appendAiMessage = (content: string) => {
    setChatHistories((prev) => {
      const prevMessages = prev[character.id] ?? [];

      return {
        ...prev,
        [character.id]: [
          ...prevMessages,
          {
            id: crypto.randomUUID(),
            role: "ai",
            content,
          },
        ],
      };
    });
  };

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {/* =========================
          モバイル用：スライドパネル
         ========================= */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform lg:hidden",
          isPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ※ CharacterPanel の幅・中身は一切変更しない */}
        <CharacterPanel
          characters={characters}
          activeId={activeCharacterId}
          onSelect={(id) => {
            setActiveCharacterId(id as CharacterId);
            setIsPanelOpen(false); // 選択後に閉じる
          }}
        />
      </div>

      {/* モバイル用：背景オーバーレイ */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* =========================
          PC / タブレット：常時表示
         ========================= */}
      <div className="hidden lg:block">
        <CharacterPanel
          characters={characters}
          activeId={activeCharacterId}
          onSelect={(id) => setActiveCharacterId(id as CharacterId)}
        />
      </div>

      {/* =========================
          チャットエリア
         ========================= */}
      <ChatPane
        character={character}
        messages={messages}
        onSend={sendMessage}
        onAiMessage={appendAiMessage}
        onOpenPanel={() => setIsPanelOpen(true)} // ← モバイル用トグル
      />
    </div>
  );
}

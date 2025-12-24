"use client";

import { useState } from "react";
import characters from "@/data/characters.json";
import CharacterPanel from "@/components/CharacterPanel";
import ChatPane from "@/components/ChatPane";

type CharacterId = keyof typeof characters;

/**
 * Message 型
 * ChatPane と共有するためここで定義
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

  const character = characters[activeCharacterId];

  /**
   * キャラ別の会話履歴
   * key: キャラID
   * value: Message[]
   */
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(
    () => {
      /**
       * 初期化時に各キャラの initialMessage を入れておく
       * （まだ会話してないキャラ用）
       */
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
   * 現在キャラのメッセージ一覧
   */
  const messages = chatHistories[character.id] ?? [];

  /**
   * メッセージ送信処理
   * ChatPane から呼ばれる
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
   * AI からの返信を追加する場合もここに集約できる
   * （後で API 繋ぐとき用）
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
    <div className="flex h-dvh w-full">
      {/* 左：キャラ選択 */}
      <CharacterPanel
        characters={characters}
        activeId={activeCharacterId}
        onSelect={(id) => setActiveCharacterId(id as CharacterId)}
      />

      {/* 右：チャット */}
      <ChatPane
        character={character}
        messages={messages}
        onSend={sendMessage}
        onAiMessage={appendAiMessage}
      />
    </div>
  );
}

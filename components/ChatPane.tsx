"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* =========================
   Types
========================= */

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

type Character = {
  id: string;
  name: string;
  title: string;
  ui: {
    chatBackground?: string | null;
    placeholder: string;
  };
  system: {
    initialMessage: string;
  };
  color?: {
    accent?: string;
  };
};

/* =========================
   Props
========================= */

/**
 * ChatLayout から渡される
 * - messages      : 現在キャラの履歴
 * - onSend        : ユーザー発言追加
 * - onAiMessage   : AI発言追加
 */
type Props = {
  character: Character;
  messages: Message[];
  onSend: (content: string) => void;
  onAiMessage: (content: string) => void;
};

/* =========================
   Component
========================= */

export default function ChatPane({
  character,
  messages,
  onSend,
  onAiMessage,
}: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* =========================
     メッセージ送信
  ========================= */

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const content = input;

    // ① UI即応：ユーザー発言を ChatLayout 側に追加
    onSend(content);
    setInput("");
    setIsLoading(true);

    try {
      /**
       * ② API Route (/api/chat) に送信
       * ChatLayout が持っている messages をそのまま使用
       */
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: character.id,
          messages: [...messages, { role: "user", content }],
        }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      /**
       * ③ AI の返答を取得
       */
      const aiReply = (await res.json()) as {
        role: "ai";
        content: string;
      };

      // ④ AI発言を ChatLayout 側に追加
      onAiMessage(aiReply.content);
    } catch (error) {
      console.error("[ChatPane] API Error:", error);

      onAiMessage("……少し調子が悪いみたい。また後で話しかけて。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative z-10 flex h-dvh flex-1 flex-col">
      {/* キャラ別チャット背景 */}
      {character.ui.chatBackground && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url(${character.ui.chatBackground})`,
            filter: "blur(1px) brightness(1.0)",
          }}
        />
      )}

      {/* ヘッダー */}
      <header className="relative overflow-hidden border-b border-white/10 px-6 py-4 backdrop-blur-md">
        {character.color?.accent && (
          <div
            className={cn(
              "absolute inset-0 -z-10 bg-gradient-to-br opacity-70",
              character.color.accent
            )}
          />
        )}

        <div>
          <h2 className="font-gensou text-lg text-white">{character.name}</h2>
          <p className="text-xs text-white/50">{character.title}</p>
        </div>
      </header>

      {/* チャットエリア */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "gensou-card max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  isUser
                    ? "chat-user rounded-br-none"
                    : "chat-ai rounded-bl-none"
                )}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* 入力欄 */}
      <footer className="border-t border-white/10 px-6 py-4 backdrop-blur-md">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={character.ui.placeholder}
            rows={1}
            disabled={isLoading}
            className="min-h-[44px] flex-1 resize-none rounded-xl bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="rounded-xl bg-white/90 px-5 py-3 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
          >
            送信
          </button>
        </div>
      </footer>
    </main>
  );
}

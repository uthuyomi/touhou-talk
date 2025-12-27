"use client";

import { useEffect, useRef, useState } from "react";
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
  color?: {
    accent?: string;
  };
};

/* =========================
   Props
========================= */

type Props = {
  character: Character;
  messages: Message[];
  onSend: (content: string) => void;
  onAiMessage: (content: string) => void;
  onOpenPanel: () => void;
};

/* =========================
   Component
========================= */

export default function ChatPane({
  character,
  messages,
  onSend,
  onAiMessage,
  onOpenPanel,
}: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* =========================
     textarea 自動リサイズ
  ========================= */

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  /* =========================
     メッセージ送信
  ========================= */

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const content = input;

    onSend(content);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          messages: [...messages, { role: "user", content }],
        }),
      });

      if (!res.ok) throw new Error("API request failed");

      const aiReply = (await res.json()) as {
        role: "ai";
        content: string;
      };

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
      {/* 背景 */}
      {character.ui.chatBackground && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url(${character.ui.chatBackground})`,
            filter: "blur(1px) brightness(1.0)",
          }}
        />
      )}

      {/* =========================
          ヘッダー
         ========================= */}
      <header className="relative border-b border-white/10 px-6 py-4 backdrop-blur-md">
        {character.color?.accent && (
          <div
            className={cn(
              "absolute inset-0 -z-10 bg-gradient-to-br opacity-70",
              character.color.accent
            )}
          />
        )}

        <button
          onClick={onOpenPanel}
          className="lg:hidden absolute right-4 top-4 z-50 rounded-lg px-2 py-1 text-white/80 hover:bg-white/10"
        >
          ☰
        </button>

        <div className="pr-10">
          <h2 className="font-gensou text-lg text-white">{character.name}</h2>
          <p className="text-xs text-white/50">{character.title}</p>
        </div>
      </header>

      {/* =========================
          チャットエリア
         ========================= */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {messages
          .filter((msg) => msg.id !== "init")
          .map((msg) => {
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

      {/* =========================
          入力欄
         ========================= */}
      <footer className="border-t border-white/10 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-end gap-3 rounded-2xl bg-black/40 p-3 shadow-lg">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={character.ui.placeholder}
              disabled={isLoading}
              rows={1}
              className="
                flex-1
                resize-none
                bg-transparent
                px-3
                py-2
                text-sm
                text-white
                outline-none
                placeholder:text-white/40
              "
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
              className="
                shrink-0
                rounded-xl
                bg-white/90
                px-5
                py-2.5
                text-sm
                font-medium
                text-black
                transition
                hover:bg-white
                disabled:opacity-50
              "
            >
              送信
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

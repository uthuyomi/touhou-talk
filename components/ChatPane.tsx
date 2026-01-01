"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/* =========================
   Types
========================= */

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;

  /** グループ用：誰が喋ったか（表示専用） */
  speakerId?: string;
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

/** ★ グループチャット文脈（UI用に拡張） */
type GroupContext = {
  enabled: boolean;
  label: string;
  participants: Character[];
  ui?: {
    chatBackground?: string;
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
  onAiMessage: (content: string, speakerId?: string) => void;
  onOpenPanel: () => void;
  mode?: "single" | "group";
  groupContext?: GroupContext | null;
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
  mode = "single",
  groupContext,
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
     speakerId → Character 解決
  ========================= */

  const speakerMap = useMemo(() => {
    if (mode !== "group" || !groupContext) return null;
    return new Map(groupContext.participants.map((c) => [c.id, c]));
  }, [mode, groupContext]);

  /* =========================
     背景決定（single / group）
  ========================= */

  const backgroundImage =
    mode === "group"
      ? groupContext?.ui?.chatBackground
      : character.ui.chatBackground;

  /* =========================
     メッセージ送信
  ========================= */

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const content = input;
    setInput("");
    setIsLoading(true);

    onSend(content);

    try {
      const endpoint = mode === "group" ? "/api/group-chat" : "/api/chat";

      const payload =
        mode === "group"
          ? {
              context: groupContext,
              userMessage: content,
              participants: groupContext?.participants.map((c) => c.id) ?? [],
            }
          : {
              characterId: character.id,
              messages: [...messages, { role: "user", content }],
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();

      if (mode === "group") {
        onAiMessage(data.content, data.speakerId);
      } else {
        onAiMessage(data.content);
      }
    } catch (error) {
      console.error("[ChatPane] API Error:", error);
      onAiMessage("……少し調子が悪いみたい。また後で話しかけて。");
    } finally {
      setIsLoading(false);
    }
  };

  /* ========================= */

  return (
    <main className="relative z-10 flex h-dvh flex-1 flex-col">
      {/* =========================
          背景（single / group 両対応）
         ========================= */}
      {backgroundImage && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            filter: "blur(1px) brightness(0.95)",
          }}
        />
      )}

      {/* =========================
          ヘッダー
         ========================= */}
      <header className="relative border-b border-white/10 px-6 py-4 backdrop-blur-md">
        {mode === "group" && groupContext?.ui?.accent && (
          <div
            className={cn(
              "absolute inset-0 -z-10 bg-gradient-to-br",
              groupContext.ui.accent
            )}
          />
        )}

        {mode === "single" && character.color?.accent && (
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
          <h2 className="font-gensou text-lg text-white">
            {mode === "group" ? groupContext?.label : character.name}
          </h2>
          <p className="text-xs text-white/50">
            {mode === "group" ? "グループチャット" : character.title}
          </p>
        </div>
      </header>

      {/* =========================
          チャット表示
         ========================= */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {messages
          .filter((m) => m.id !== "init")
          .map((msg) => {
            const isUser = msg.role === "user";
            const speaker =
              mode === "group" && msg.speakerId && speakerMap
                ? speakerMap.get(msg.speakerId)
                : null;

            const displayContent = !isUser
              ? msg.content.replace(/\\n/g, "\n")
              : msg.content;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div className="max-w-[70%]">
                  {!isUser && mode === "group" && speaker && (
                    <div className="mb-1 text-xs text-white/60">
                      {speaker.name}
                    </div>
                  )}

                  <div
                    className={cn(
                      "gensou-card rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      isUser
                        ? "chat-user rounded-br-none"
                        : "chat-ai rounded-bl-none"
                    )}
                  >
                    {displayContent}
                  </div>
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
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
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
              className="shrink-0 rounded-xl bg-white/90 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
            >
              送信
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

"use client";

import { cn } from "@/lib/utils";

/* =========================
   Types
========================= */

type Character = {
  id: string;
  name: string;
  title: string;
  color?: {
    accent?: string;
    text?: string;
  };
};

type Props = {
  characters: Record<string, Character>;
  activeId: string;
  onSelect: (id: string) => void;
};

/* =========================
   Component
========================= */

export default function CharacterPanel({
  characters,
  activeId,
  onSelect,
}: Props) {
  return (
    <aside className="gensou-sidebar relative z-10 flex h-dvh w-72 flex-col p-4">
      {/* タイトル */}
      <div className="mb-6 px-2">
        <h1 className="font-gensou text-xl tracking-wide text-white/90">
          Touhou Talk
        </h1>
        <p className="mt-1 text-xs text-white/50">幻想郷対話記録</p>
      </div>

      {/* キャラリスト */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {Object.values(characters).map((ch) => {
          const active = ch.id === activeId;
          const accent = ch.color?.accent;

          return (
            <button
              key={ch.id}
              onClick={() => onSelect(ch.id)}
              className={cn(
                "relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all",
                active
                  ? "border-white/30 shadow-lg"
                  : "border-white/10 hover:border-white/20"
              )}
            >
              {/* 幻想アクセント（選択中のみ表示） */}
              {active && accent && (
                <div
                  className={cn(
                    "absolute inset-0 -z-10 bg-gradient-to-br blur-xl",
                    accent
                  )}
                />
              )}

              <div className="relative z-10">
                <div className="font-gensou text-base text-white">
                  {ch.name}
                </div>
                <div className="mt-0.5 text-xs text-white/60">{ch.title}</div>
              </div>

              {/* 選択インジケータ */}
              {active && (
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </div>

      {/* フッター */}
      <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/40">
        © Touhou Talk UI Demo
      </div>
    </aside>
  );
}

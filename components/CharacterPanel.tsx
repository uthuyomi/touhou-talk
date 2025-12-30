"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { GroupDef } from "@/data/group";

/* =========================
   Types
========================= */

type Character = {
  id: string;
  name: string;
  title: string;
  world?: {
    map: string;
    location: string;
  };
  color?: {
    accent?: string;
    text?: string;
  };
};

type GroupContext = {
  enabled: boolean;
  label: string;
  group: GroupDef;
};

type Props = {
  characters: Record<string, Character>;
  activeId: string;
  onSelect: (id: string) => void;

  currentLocationId?: string | null;
  currentLayer?: string | null;
  fullScreen?: boolean;

  groupContext?: GroupContext | null;
  onStartGroup?: () => void;

  mode?: "single" | "group";
};

/* =========================
   Component
========================= */

export default function CharacterPanel({
  characters,
  activeId,
  onSelect,
  currentLocationId,
  currentLayer,
  fullScreen = false,
  groupContext,
  onStartGroup,
  mode = "single",
}: Props) {
  const router = useRouter();

  /* =========================
     PC / SP 判定（UI用のみ）
  ========================= */
  const [isPC, setIsPC] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsPC(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* =========================
     共通データ
  ========================= */

  const allCharacters = useMemo(() => Object.values(characters), [characters]);

  const visibleCharacters = useMemo(() => {
    if (!currentLocationId) return [];
    return allCharacters.filter((c) => c.world?.location === currentLocationId);
  }, [allCharacters, currentLocationId]);

  const isGroupActive = useMemo(() => {
    return Boolean(
      mode === "group" &&
        groupContext?.enabled &&
        currentLocationId != null &&
        groupContext.group.world?.location === currentLocationId
    );
  }, [mode, groupContext, currentLocationId]);

  const groupAccent = groupContext?.group.ui?.accent;

  /* ========================= */

  return (
    <aside
      className={cn(
        "gensou-sidebar relative z-10 flex h-dvh flex-col p-4",
        fullScreen ? "w-full" : "w-72"
      )}
    >
      {/* タイトル */}
      <div className="mb-4 px-2">
        <h1 className="font-gensou text-xl tracking-wide text-white/90">
          Touhou Talk
        </h1>
        <p className="mt-1 text-xs text-white/50">幻想郷対話記録</p>
      </div>

      {/* 戻るボタン（UI差分のみ） */}
      {currentLocationId != null && (
        <button
          onClick={() => {
            if (currentLayer) {
              router.push(`/map/${currentLayer}`);
            } else {
              router.push("/map");
            }
          }}
          className={cn(
            "mx-2 mb-4 rounded-lg border px-3 py-2 text-left text-sm transition",
            "border-white/15 bg-black/40 text-white/80 hover:bg-black/60",
            !isPC && "text-xs"
          )}
        >
          ← マップに戻る
        </button>
      )}

      {/* =========================
          リスト本体（完全共通）
         ========================= */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {currentLocationId == null && (
          <div className="px-2 text-xs text-white/40">
            マップから場所を選択してください
          </div>
        )}

        {/* グループチャット */}
        {currentLocationId != null && groupContext?.enabled && onStartGroup && (
          <button
            onClick={onStartGroup}
            className={cn(
              "relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all",
              isGroupActive
                ? "border-white/40 shadow-lg"
                : "border-white/20 hover:border-white/40 bg-black/30"
            )}
          >
            {isGroupActive && groupAccent && (
              <div
                className={cn(
                  "absolute inset-0 -z-10 bg-gradient-to-br blur-xl",
                  groupAccent
                )}
              />
            )}

            <div className="relative z-10">
              <div className="font-gensou text-base text-white">
                {groupContext.group.name}
              </div>
              <div className="mt-0.5 text-xs text-white/60">
                {groupContext.group.title}
              </div>
            </div>

            {isGroupActive && (
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/80" />
            )}
          </button>
        )}

        {/* キャラ一覧 */}
        {visibleCharacters.map((ch) => {
          const active = mode !== "group" && ch.id === activeId;
          const accent = ch.color?.accent;

          return (
            <button
              key={ch.id}
              onClick={() => onSelect(ch.id)}
              className={cn(
                "relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all",
                active
                  ? "border-white/30 shadow-lg"
                  : "border-white/10 hover:border-white/20",
                mode === "group" && "opacity-80"
              )}
            >
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

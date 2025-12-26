// components/map/WorldMap.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LayerId, MapLocation } from "@/lib/map/locations";

type Props = {
  layer: LayerId;
  backgroundSrc: string;
  locations: MapLocation[];
};

export default function WorldMap({ layer, backgroundSrc, locations }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () => locations.find((l) => l.id === activeId) ?? null,
    [activeId, locations]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 背景 */}
      <div className="absolute inset-0">
        <Image
          src={backgroundSrc}
          alt={`${layer} map`}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* レイヤー切替 */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <LayerPill
          href="/map/gensokyo"
          label="幻想郷"
          active={layer === "gensokyo"}
        />
        <LayerPill href="/map/deep" label="深層" active={layer === "deep"} />
        <LayerPill href="/map/higan" label="彼岸" active={layer === "higan"} />
      </div>

      {/* クリックポイント */}
      <div className="absolute inset-0 z-10">
        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActiveId(loc.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 hover:bg-white/90 transition shadow"
            style={{
              left: `${loc.pos.x}%`,
              top: `${loc.pos.y}%`,
              width: `${loc.hitRadius * 10}px`,
              height: `${loc.hitRadius * 10}px`,
            }}
            aria-label={loc.name}
            title={loc.name}
          />
        ))}
      </div>

      {/* 場所カード */}
      <div className="absolute bottom-4 right-4 z-30 w-[320px] max-w-[92vw]">
        {active ? (
          <div className="rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 shadow-xl p-4 text-white">
            <div className="text-sm opacity-80">{labelByLayer(layer)}</div>
            <div className="text-xl font-semibold mt-1">{active.name}</div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveId(null)}
                className="text-sm opacity-70 hover:opacity-100 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 p-4 text-white/80">
            マップ上の点をクリック
          </div>
        )}
      </div>
    </div>
  );
}

function LayerPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-white/20 border-white/25 text-white"
          : "bg-black/30 border-white/10 text-white/80 hover:bg-black/45 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function labelByLayer(layer: LayerId) {
  switch (layer) {
    case "gensokyo":
      return "Layer1：幻想郷";
    case "deep":
      return "Layer2：深層";
    case "higan":
      return "Layer3：彼岸";
  }
}

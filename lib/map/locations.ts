// lib/map/locations.ts

/* =========================
 * World / Layer definition
 * ========================= */

export type LayerId = "gensokyo" | "deep" | "higan";

/* =========================
 * Location definition
 * =========================
 * ※ キャラ概念は一旦持たない
 */

export type MapLocation = {
  id: string;
  layer: LayerId;
  name: string; // UIカード専用（マップ上に文字は出さない）
  pos: { x: number; y: number }; // 0..100 (%)
  hitRadius: number;
};

/* =========================
 * Backgrounds
 * ========================= */

export const MAP_BACKGROUNDS: Record<LayerId, string> = {
  gensokyo: "/maps/gensokyo.png",
  deep: "/maps/deep.png",
  higan: "/maps/higan.png",
};

/* =========================
 * World data (Single Source of Truth)
 * ========================= */

export const LOCATIONS: readonly MapLocation[] = [
  // ===== Layer1: 幻想郷 =====
  {
    id: "hakurei_shrine",
    layer: "gensokyo",
    name: "博麗神社",
    pos: { x: 30, y: 20 },
    hitRadius: 3.2,
  },
  {
    id: "moriya_shrine",
    layer: "gensokyo",
    name: "守矢神社",
    pos: { x: 55, y: 22 },
    hitRadius: 3.2,
  },
  {
    id: "human_village",
    layer: "gensokyo",
    name: "人里",
    pos: { x: 46, y: 55 },
    hitRadius: 4.0,
  },
  {
    id: "forest_of_magic",
    layer: "gensokyo",
    name: "魔法の森",
    pos: { x: 28, y: 64 },
    hitRadius: 4.0,
  },
  {
    id: "youkai_mountain",
    layer: "gensokyo",
    name: "妖怪の山",
    pos: { x: 45, y: 10 },
    hitRadius: 4.0,
  },
  {
    id: "scarlet_mansion",
    layer: "gensokyo",
    name: "紅魔館",
    pos: { x: 78, y: 16 },
    hitRadius: 3.8,
  },
  {
    id: "bamboo_forest",
    layer: "gensokyo",
    name: "迷いの竹林",
    pos: { x: 72, y: 72 },
    hitRadius: 4.2,
  },
  {
    id: "eientei",
    layer: "gensokyo",
    name: "永遠亭",
    pos: { x: 83, y: 78 },
    hitRadius: 3.2,
  },

  // ===== Layer2: 深層 =====
  {
    id: "old_capital",
    layer: "deep",
    name: "旧都（旧市街地）",
    pos: { x: 70, y: 55 },
    hitRadius: 4.2,
  },
  {
    id: "mansion_and_bridge",
    layer: "deep",
    name: "洋風の屋敷（橋で旧都へ）",
    pos: { x: 30, y: 38 },
    hitRadius: 4.0,
  },
  {
    id: "chireiden",
    layer: "deep",
    name: "地霊殿",
    pos: { x: 28, y: 42 },
    hitRadius: 4.5,
  },
  {
    id: "chireiden_entrance",
    layer: "deep",
    name: "地霊殿への穴",
    pos: { x: 50, y: 80 },
    hitRadius: 4.2,
  },

  // ===== Layer3: 彼岸 =====
  {
    id: "sanzu_river",
    layer: "higan",
    name: "三途の川",
    pos: { x: 40, y: 62 },
    hitRadius: 4.4,
  },
  {
    id: "hakugyokurou",
    layer: "higan",
    name: "白玉楼",
    pos: { x: 35, y: 30 },
    hitRadius: 4.0,
  },
  {
    id: "shikieiki_office",
    layer: "higan",
    name: "是非曲直庁",
    pos: { x: 72, y: 42 },
    hitRadius: 4.0,
  },
] as const;

/* =========================
 * Selectors
 * ========================= */

export function getLocationsByLayer(layer: LayerId): MapLocation[] {
  return LOCATIONS.filter((l) => l.layer === layer);
}

export function findLocation(
  layer: LayerId,
  locationId: string
): MapLocation | undefined {
  return LOCATIONS.find((l) => l.layer === layer && l.id === locationId);
}

// lib/chat/groupContext.ts
//
// ✅ Group Chat の「核」になる中立ロジック。
// - UI も API も触らず、ここで「場」と「参加者」と「履歴」を統合する
// - ここは “LLM を呼ばない” 純データ組み立て層
//
// 目的：
// - location（場所）を入力したら、その場所に存在するキャラを CHARACTERS から抽出
// - data が存在しないキャラは自動的に除外
// - グループチャット用の「共通コンテキスト」を生成する
//

import { CHARACTERS } from "@/data/characters";

/* =========================
   Types (App-level)
========================= */

/**
 * チャットログの最小構造
 * - 単体 / グループ両対応
 */
export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;

  /**
   * グループチャット用
   * - ai 発言時、誰が喋ったかを示す
   */
  speakerId?: string;
};

/**
 * キャラ定義（CHARACTERS の shape を踏襲）
 */
export type CharacterDef = {
  id: string;
  name: string;
  title: string;
  world?: {
    map: string;
    location: string;
  };
  color: {
    accent: string;
  };
  ui: {
    chatBackground: string;
    placeholder: string;
  };
};

/**
 * グループチャットの「場」定義
 */
export type GroupContext = {
  /** 現在のマップ層 */
  layer: string | null;

  /** 現在のロケーションID */
  locationId: string;

  /** 参加キャラ（データが存在するものだけ） */
  participants: CharacterDef[];

  /** 表示用ラベル（今は locationId） */
  label: string;

  /** グループチャットの履歴 */
  history: ChatMessage[];

  /** 現在の話者（未開始時は null） */
  currentSpeakerId: string | null;

  /**
   * この場でグループチャットが成立するか
   * - participants が 1人以上
   */
  enabled: boolean;
};

/* =========================
   Helpers
========================= */

/**
 * 指定ロケーションに存在するキャラを抽出
 */
export function getParticipantsByLocation(locationId: string): CharacterDef[] {
  const all = Object.values(CHARACTERS) as CharacterDef[];

  return all.filter((c) => {
    const loc = c.world?.location;
    return typeof loc === "string" && loc === locationId;
  });
}

/**
 * GroupContext を生成（未開始状態）
 *
 * - ここでは「誰が喋るか」はまだ決めない
 */
export function buildGroupContext(args: {
  layer: string | null;
  locationId: string;
  history?: ChatMessage[];
}): GroupContext {
  const { layer, locationId } = args;

  const participants = getParticipantsByLocation(locationId);
  const history = args.history ?? [];

  return {
    layer,
    locationId,
    participants,
    label: locationId,
    history,
    currentSpeakerId: null,
    enabled: participants.length >= 1,
  };
}

/* =========================
   Group start utilities
========================= */

/**
 * ランダムに話者を 1 人選ぶ
 * - participants が空なら null
 */
export function pickRandomSpeaker(
  participants: CharacterDef[]
): CharacterDef | null {
  if (participants.length === 0) return null;

  const index = Math.floor(Math.random() * participants.length);
  return participants[index];
}

/**
 * グループチャット開始用の初期化
 *
 * - 最初の話者をランダムに決定
 * - 初期メッセージを生成
 * - currentSpeakerId を確定させる
 *
 * 👉 UI / API からはこれを呼ぶだけでよい
 */
export function initializeGroupContext(ctx: GroupContext): GroupContext {
  if (!ctx.enabled) return ctx;

  // 既に開始済みなら何もしない
  if (ctx.currentSpeakerId) return ctx;

  const firstSpeaker = pickRandomSpeaker(ctx.participants);

  if (!firstSpeaker) return ctx;

  const initMessage: ChatMessage = {
    id: "init",
    role: "ai",
    speakerId: firstSpeaker.id,
    content: `……${firstSpeaker.name} が、静かに口を開いた。`,
  };

  return {
    ...ctx,
    currentSpeakerId: firstSpeaker.id,
    history: ctx.history.length === 0 ? [initMessage] : ctx.history,
  };
}

/* =========================
   Optional utilities
========================= */

/**
 * 参加者IDリストを返す
 */
export function getParticipantIds(ctx: GroupContext): string[] {
  return ctx.participants.map((p) => p.id);
}

/**
 * 汎用：場の雰囲気メッセージ
 * （将来イベント用）
 */
export function createGroupInitMessage(locationId: string): ChatMessage {
  return {
    id: "init",
    role: "ai",
    content: `……${locationId} の空気が、少しだけざわついている。`,
  };
}

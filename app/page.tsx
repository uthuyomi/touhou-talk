"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FogOverlay from "@/components/top/FogOverlay";
import YinYangLoader from "@/components/top/YinYangLoader";

export default function TopPage() {
  const router = useRouter();
  const [fog, setFog] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // タイピング表示用テキスト
  // =========================
  const lines = useMemo(
    () => ["ここは幻想郷。", "言葉は、境界を越えて交わされる。"],
    []
  );

  const fullText = useMemo(() => lines.join("\n"), [lines]);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    let timer: number | null = null;

    const tick = () => {
      i += 1;
      setTyped(fullText.slice(0, i));

      if (i < fullText.length) {
        const ch = fullText[i - 1];
        const delay = ch === "。" || ch === "、" ? 180 : ch === "\n" ? 260 : 45;
        timer = window.setTimeout(tick, delay);
      }
    };

    timer = window.setTimeout(tick, 250);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [fullText]);

  // =========================
  // 侵入（境界通過）
  // =========================
  const enter = () => {
    setFog(true);
    setLoading(true);

    // PC / Mobile 判定（Tailwind lg と同基準）
    const isPC = window.matchMedia("(min-width: 1024px)").matches;

    setTimeout(() => {
      if (isPC) {
        // PC → マップ
        router.push("/map/gensokyo");
      } else {
        // スマホ・タブレット → 直接チャット
        router.push("/chat");
      }
    }, 1200); // 儀式時間
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* =========================
          背景動画（PC）
         ========================= */}
      <video
        className="absolute inset-0 hidden h-full object-cover lg:block m-auto"
        src="/top/top-pc.mp4"
        autoPlay
        muted
        playsInline
      />

      {/* =========================
          背景イラスト（SP）
         ========================= */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/top/top-sp.png"
          alt="幻想郷"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* =========================
          中央（文言 + ボタン）
         ========================= */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center">
        {/* タイピング文言 */}
        <div className="px-6 py-4">
          <p
            className="
              font-gensou
              whitespace-pre-line
              text-xl
              sm:text-2xl
              lg:text-3xl
              leading-relaxed
              text-white/95
              drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]
              drop-shadow-[0_0_22px_rgba(140,100,220,0.35)]
            "
          >
            {typed}
            {typed.length < fullText.length && (
              <span className="ml-1 inline-block animate-pulse">▍</span>
            )}
          </p>
        </div>

        {/* ボタン */}
        <button
          onClick={enter}
          className="
            rounded-xl
            bg-white/80
            px-8 py-4
            text-lg font-medium
            backdrop-blur
            transition
            hover:bg-white
            text-black
          "
        >
          境界を越える
        </button>
      </div>

      {/* =========================
          霧 + 陰陽玉ローディング
         ========================= */}
      <FogOverlay visible={fog} />
      <YinYangLoader visible={loading} />
    </main>
  );
}

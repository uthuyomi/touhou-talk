import ChatLayout from "@/components/ChatLayout";

export default function HomePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* 背景：幻想郷 */}
      <div
        className="gensou-background"
        style={{
          backgroundImage: "url(/bg/gensokyo-shrine.jpg)",
        }}
      />

      {/* 幻想オーバーレイ */}
      <div className="gensou-overlay" />

      {/* UI本体 */}
      <div className="relative z-10 h-dvh w-full">
        <ChatLayout />
      </div>
    </div>
  );
}

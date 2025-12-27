// app/chat/page.tsx
import { Suspense } from "react";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-full items-center justify-center text-white/40">
          読み込み中…
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}

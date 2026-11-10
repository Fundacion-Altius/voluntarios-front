"use client";

import { MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatbotPanel } from "./ChatbotPanel";
import { useChatbotDisplayName } from "./chatbotDisplayName";

/**
 * Floating Alti trigger. Positioned above the admin bottom nav and any
 * page-level fixed action bars via --admin-fab-bottom / --admin-fixed-bar-h.
 */
export function ChatbotDrawer() {
  const { data: session, status } = useSession();
  const authToken = (session as { authToken?: string } | null)?.authToken;
  const { displayName } = useChatbotDisplayName(status === "authenticated" && !!session, authToken);

  if (status !== "authenticated" || !session) {
    return null;
  }

  return (
    <div
      className="fixed right-4 z-40"
      style={{ bottom: "var(--admin-fab-bottom, 5rem)" }}
      data-testid="chatbot-fab-anchor"
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="h-12 rounded-full px-4 shadow-lg"
            data-testid="chatbot-drawer-trigger"
            aria-label={`Abrir ${displayName}`}
          >
            <MessageCircle className="size-5" />
            {displayName}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md" data-testid="chatbot-drawer">
          <SheetHeader className="p-4 pb-2 pr-12">
            <SheetTitle data-testid="chatbot-drawer-title">{displayName}</SheetTitle>
            <SheetDescription>Interfaz de lenguaje natural para tareas internas.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ChatbotPanel showHeader={false} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

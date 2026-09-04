import { ChatbotPanel } from "@/components/chat/ChatbotPanel";

export const dynamic = "force-dynamic";

export default function ChatbotPage() {
  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4">
        <p className="text-sm text-muted-foreground">
          Interfaz de lenguaje natural para tareas internas. Las acciones con efectos secundarios requieren aprobación
          humana antes de ejecutarse.
        </p>
      </header>
      <ChatbotPanel />
    </main>
  );
}

import { useSidebar } from "@/components/ui/sidebar"
import { LucideAlignRight } from "lucide-react"
export function CustomTrigger() {
  const { toggleSidebar } = useSidebar()

  return <button onClick={toggleSidebar}><LucideAlignRight/></button>
}

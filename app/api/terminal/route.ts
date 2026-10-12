import { loadPortfolio } from "@/lib/content/loadPortfolio";
import { createTerminalContent } from "@/components/terminal/content";

export const dynamic = "force-static";

export function GET() {
  return Response.json(createTerminalContent(loadPortfolio()));
}

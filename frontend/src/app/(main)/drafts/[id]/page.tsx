import { redirect } from "next/navigation";

interface DraftPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DraftPage({ params }: DraftPageProps) {
  // Await params to satisfy Next.js 15 requirements
  await params;
  
  // Redirect to drafts list to avoid routing loops and provide a safe fallback
  // if users land on this intermediate path via breadcrumbs or history
  redirect(`/drafts`);
}
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function PrincipleHeader({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description?: string;
}) {
  return (
    <>
      <Link
        href="/principles"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-accent"
      >
        <ArrowLeft size={13} /> All principles
      </Link>
      <PageHeader title={`Principle ${number} — ${title}`} description={description} />
    </>
  );
}

import { useState } from "react";
import { Search, Filter, Eye, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StartupDocument } from "@/types";
import { EmptyNote, DOCUMENT_CATEGORIES, fileIconFor } from "./shared";

export function DocumentsTab({ documents, pitchDeckUrl }: { documents: StartupDocument[]; pitchDeckUrl?: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All Documents");
  const [showAll, setShowAll] = useState(false);

  const allDocs: StartupDocument[] = [
    ...(pitchDeckUrl && !documents.some((d) => d.category === "Pitch Deck")
      ? [{ name: "Pitch Deck", url: pitchDeckUrl, category: "Pitch Deck" as const }]
      : []),
    ...documents,
  ];

  const filtered = allDocs.filter((d) => {
    const matchesCategory = category === "All Documents" || d.category === category;
    const matchesSearch = !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()) || d.description?.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const visible = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-extrabold text-[#0f172a]">Documents</h3>
          <p className="mt-1 text-[12.5px] text-[#64748b]">Important documents and files related to this startup.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="w-56 pl-9" />
          </div>
          <button
            onClick={() => {
              setSearch("");
              setCategory("All Documents");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
          >
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setCategory("All Documents"); setShowAll(false); }}
          className={cn("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", category === "All Documents" ? "bg-[#ffece5] text-[#FF5722]" : "text-[#64748b] hover:bg-[#f8fafc]")}
        >
          All Documents
        </button>
        {DOCUMENT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(c); setShowAll(false); }}
            className={cn("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", category === c ? "bg-[#ffece5] text-[#FF5722]" : "text-[#64748b] hover:bg-[#f8fafc]")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e2e8f0]">
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyNote text="No documents match your search." /></div>
        ) : (
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#94a3b8]">
                <th className="px-4 py-3 font-semibold">Document Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Uploaded On</th>
                <th className="px-4 py-3 font-semibold">File Size</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d, i) => {
                const fi = fileIconFor(d.url);
                const FileIcon = fi.icon;
                return (
                  <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: fi.bg, color: fi.fg }}>
                          <FileIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0f172a]">{d.name}</p>
                          {d.description && <p className="text-[11px] text-[#94a3b8]">{d.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{d.category}</td>
                    <td className="px-4 py-3 text-[#64748b]">{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="px-4 py-3 text-[#64748b]">{d.fileSize || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
                          <Eye className="h-3.5 w-3.5" /> View
                        </a>
                        <a href={d.url} download target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
        >
          {showAll ? "Show Fewer Documents" : "Load More Documents"}
        </button>
      )}
    </div>
  );
}

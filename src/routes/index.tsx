import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imperium: Il Quiz di Geostoria" },
       { name: "description", content: "Scegli Storia o Attualità: territori e capitali dell'Impero Romano oppure degli stati di Europa e Mediterraneo, in 5 minuti." },
      { property: "og:title", content: "Imperium: Il Quiz di Geostoria" },
       { property: "og:description", content: "Due modalità, un'unica sfida: Roma antica o geografia moderna di Europa e Mediterraneo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
       src="/imperium/index.html?v=4"
      title="Imperium: Il Quiz di Geostoria"
      className="block h-screen w-full border-0"
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imperium: Il Quiz di Geostoria" },
      { name: "description", content: "Quiz di geostoria sull'Impero Romano: riconosci territori e capitali sulla cartina storica in 5 minuti." },
      { property: "og:title", content: "Imperium: Il Quiz di Geostoria" },
      { property: "og:description", content: "Riconosci territori e capitali dell'Impero Romano sulla cartina storica in 5 minuti." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/imperium/index.html?v=3"
      title="Imperium: Il Quiz di Geostoria"
      className="block h-screen w-full border-0"
    />
  );
}

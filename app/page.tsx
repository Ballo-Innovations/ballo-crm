import { BookOpenText, LayoutDashboard, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const foundationLinks = [
  {
    title: "Vision & roadmap",
    description: "Problem, personas, MVP scope, and long-term direction.",
    path: "docs/vision.md",
    icon: BookOpenText,
  },
  {
    title: "Architecture",
    description: "System, Firestore, BalloAds, and Brutus AI integration design.",
    path: "docs/architecture.md",
    icon: LayoutDashboard,
  },
  {
    title: "Sprint 1 tasks",
    description: "Developer assignments and the current sprint board.",
    path: "docs/tasks/sprint-1.md",
    icon: ListChecks,
  },
];

export default function Home() {
  return (
    <div className="bg-muted/30 flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            Project foundation — feature build has not started
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{siteConfig.name}</h1>
          <p className="text-muted-foreground max-w-xl text-lg">{siteConfig.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {foundationLinks.map(({ title, description, path, icon: Icon }) => (
            <Card key={path}>
              <CardHeader>
                <Icon className="text-muted-foreground mb-2 size-5" />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <code className="text-muted-foreground mt-1 block text-xs">{path}</code>
              </CardHeader>
            </Card>
          ))}
        </div>

        <p className="text-muted-foreground text-sm">
          Full documentation index lives at{" "}
          <code className="text-foreground font-medium">docs/README.md</code> in the repository.
        </p>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { primaryNav } from "@/lib/site";

/** Scaffold-only page body. Each module's first ticket replaces it. */
export function ModulePlaceholder({ href }: { href: string }) {
  const item = primaryNav.find((entry) => entry.href === href);
  if (!item) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Not built yet</CardTitle>
          <CardDescription>{item.summary}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p>Epic: {item.epic}</p>
          <p>
            Spec: <code className="font-mono text-xs">{item.spec}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

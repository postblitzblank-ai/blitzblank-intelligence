import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function GoogleVerbindung() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Noch nicht mit Google verbunden — nötig für Gmail-Versand und Search
          Console.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/einstellungen" });
          }}
        >
          <Button type="submit" size="sm">
            Mit Google verbinden
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
          Verbunden
        </Badge>
        <span className="text-muted-foreground">{session.user.email}</span>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/einstellungen" });
        }}
      >
        <Button type="submit" size="sm" variant="outline">
          Trennen
        </Button>
      </form>
    </div>
  );
}

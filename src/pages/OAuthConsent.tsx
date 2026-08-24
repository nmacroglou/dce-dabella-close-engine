import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";

type AuthorizationDetails = {
  client?: { name?: string; client_name?: string; logo_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
};

// The `supabase.auth.oauth` namespace is beta; wrap the three methods we use.
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: decideError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "this app";

  return (
    <main className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md card-premium p-8 text-center">
        <img src={dabellaLogo} alt="DaBella" className="h-9 w-auto mx-auto mb-5" />
        {error ? (
          <>
            <h1 className="text-lg font-display font-extrabold text-foreground">
              Could not load this authorization request
            </h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </>
        ) : !details ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-3" />
            <h1 className="text-xl font-display font-extrabold text-foreground">
              Connect {clientName} to your account
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {clientName} will be able to read and update your deals, pipeline and follow-ups in
              Close Engine, acting as you.
            </p>
            <div className="flex gap-3 mt-7">
              <Button variant="outline" className="flex-1 h-11" disabled={busy} onClick={() => decide(false)}>
                Deny
              </Button>
              <Button
                className="flex-1 h-11 gradient-brand text-primary-foreground"
                disabled={busy}
                onClick={() => decide(true)}
              >
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

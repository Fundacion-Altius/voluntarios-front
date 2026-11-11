"use client";

import { ChefHat, type LucideIcon, RefreshCw, Utensils, Wine } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DemoDataBadge } from "@/components/DemoDataBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDemoServiceLabel } from "@/lib/demoData";
import { StationView } from "@/modules/comandero/components/StationView";
import { WaiterView } from "@/modules/comandero/components/WaiterView";
import { formatClock } from "@/modules/comandero/money";
import type { OpenSession } from "@/modules/comandero/types";
import { useComanderoOpenSessions } from "@/modules/comandero/useComandero";

type Role = "camarero" | "cocina" | "barra";

const ROLES: ReadonlyArray<{ value: Role; icon: LucideIcon }> = [
  { value: "camarero", icon: Utensils },
  { value: "cocina", icon: ChefHat },
  { value: "barra", icon: Wine },
];

/** Big, touch-friendly choice of the open services, by name. The service id is never shown. */
function ServicePicker({
  sessions,
  loaded,
  error,
  onPick,
  onRefresh,
}: {
  sessions: OpenSession[];
  loaded: boolean;
  error: string | null;
  onPick: (id: string) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations("comandero.portal.pick");
  const locale = useLocale();

  if (!loaded) {
    return (
      <p role="status" className="text-sm text-muted-foreground" data-testid="comandero-portal-loading">
        {t("loading")}
      </p>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card data-testid="comandero-portal-empty">
        <CardContent className="flex flex-col items-start gap-3 pt-6">
          <p className="font-heading text-lg font-semibold text-foreground">{t("empty")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t("loadError")}
            </p>
          )}
          <Button variant="outline" className="min-h-11" onClick={onRefresh} data-testid="comandero-portal-refresh">
            <RefreshCw aria-hidden="true" />
            {t("refresh")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2" data-testid="comandero-portal-session">
      {sessions.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            data-testid="comandero-portal-session-option"
            onClick={() => onPick(s.id)}
            className="flex min-h-16 w-full flex-col items-start gap-0.5 rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="inline-flex flex-wrap items-center gap-2 font-heading text-lg font-semibold text-foreground">
              {s.label}
              {isDemoServiceLabel(s.label) && <DemoDataBadge className="normal-case" />}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("started", { time: formatClock(s.started_at, locale) })}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function ComanderoPortalPage() {
  const t = useTranslations("comandero.portal");
  const { sessions, loaded, error, refresh } = useComanderoOpenSessions();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const joined = sessions.find((s) => s.id === sessionId) ?? null;
  // The teacher closed the service the student was in: say so instead of silently dropping them.
  const closedWhileInside = sessionId !== null && loaded && joined === null;

  return (
    <div className="space-y-6 pb-32 md:pb-8" data-testid="comandero-portal">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      {joined ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <p className="min-w-0 text-sm text-muted-foreground">
              {t("session.current")}:{" "}
              <span
                className="font-heading text-base font-semibold text-foreground"
                data-testid="comandero-portal-current"
              >
                {joined.label}
              </span>
            </p>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setSessionId(null)}
              data-testid="comandero-portal-change-session"
            >
              {t("session.change")}
            </Button>
          </div>

          <section className="space-y-3" aria-labelledby="comandero-role-title">
            <h2 id="comandero-role-title" className="font-heading text-lg font-semibold text-foreground">
              {t("role.title")}
            </h2>
            <Tabs defaultValue="camarero">
              <TabsList className="w-full gap-2 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto">
                {ROLES.map(({ value, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    data-testid={`comandero-tab-${value}`}
                    className="h-auto min-h-16 flex-col gap-1 rounded-xl border-2 border-border bg-card px-2 py-2 text-base font-semibold text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {t(`role.${value}`)}
                    <span className="text-xs font-normal opacity-80">{t(`role.${value}Hint`)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="camarero" className="mt-4">
                <WaiterView sessionId={joined.id} />
              </TabsContent>
              <TabsContent value="cocina" className="mt-4">
                <StationView sessionId={joined.id} station="cocina" />
              </TabsContent>
              <TabsContent value="barra" className="mt-4">
                <StationView sessionId={joined.id} station="barra" />
              </TabsContent>
            </Tabs>
          </section>
        </>
      ) : (
        <section className="space-y-3" aria-labelledby="comandero-pick-title">
          <div>
            <h2 id="comandero-pick-title" className="font-heading text-lg font-semibold text-foreground">
              {t("pick.title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("pick.hint")}</p>
          </div>
          {closedWhileInside && (
            <p
              role="status"
              className="rounded-md bg-cta/15 p-3 text-sm text-foreground"
              data-testid="comandero-portal-closed"
            >
              {t("session.closed")}
            </p>
          )}
          <ServicePicker sessions={sessions} loaded={loaded} error={error} onPick={setSessionId} onRefresh={refresh} />
        </section>
      )}
    </div>
  );
}

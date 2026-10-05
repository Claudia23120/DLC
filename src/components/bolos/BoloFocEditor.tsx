"use client";

import { useState } from "react";
import { FocSheet } from "@/components/bolos/FocSheet";
import { t } from "@/i18n/t";
import { FocBlock as Block } from "./foc/FocBlock";
import { AssignInput } from "./foc/AssignInput";
import { StringList } from "./foc/StringList";
import { TramsTasksEditor } from "./foc/TramsTasksEditor";
import { EncessesEditor } from "./foc/EncessesEditor";
import { useFocConfig } from "./foc/useFocConfig";
import { Grid, Row, Stack } from "@/components/ui/Layout";

interface Props {
  eventId: string;
  defaultTitle: string;
  /** All member names, for the pick-a-member datalist (free text still allowed). */
  memberNames: string[];
  /** Names signed up as diable — pre-filled into Cremadors on a fresh sheet. */
  diableNames: string[];
}

/**
 * Admin-only fire sheet editor. Client-only: the config is NOT saved to the
 * database — only mirrored to this browser's localStorage so a reload doesn't
 * lose work. Output is print / PDF via the browser.
 */
export function BoloFocEditor({ eventId, defaultTitle, memberNames, diableNames }: Props) {
  const [open, setOpen] = useState(false);
  const { config, set, reset } = useFocConfig(eventId, defaultTitle, diableNames);

  function resetSheet() {
    if (!confirm(t.foc.clearConfirm)) return;
    reset();
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => setOpen((v) => !v)}
        style={{ height: 44, fontSize: 14 }}
      >
        {t.foc.configToggle} {open ? "▲" : "▼"}
      </button>

      {open ? (
        <Stack gap={18} style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
            {t.foc.clientOnlyNote}
          </p>

          {/* — Títol — */}
          <Block label={t.foc.title}>
            <input
              className="input tap-target"
              value={config.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={t.foc.titlePlaceholder}
              style={{ height: 34, fontSize: 13, padding: "0 10px" }}
            />
          </Block>

          {/* — Llucifer / Diablessa — */}
          <Grid cols={2} gap={10}>
            <Block label={t.foc.llucifer}>
              <AssignInput
                value={config.llucifer}
                options={memberNames.filter((n) => n !== config.diablessa)}
                onChange={(v) => set({ llucifer: v })}
              />
            </Block>
            <Block label={t.foc.diablessa}>
              <AssignInput
                value={config.diablessa}
                options={memberNames.filter((n) => n !== config.llucifer)}
                onChange={(v) => set({ diablessa: v })}
              />
            </Block>
          </Grid>

          {/* — Cremadors — */}
          <Block label={t.foc.cremadors}>
            <StringList
              items={config.cremadors}
              memberNames={memberNames}
              onChange={(cremadors) => set({ cremadors })}
              addLabel={t.foc.addCremador}
            />
          </Block>

          {/* — Trams + Tasques — */}
          <Block label={t.foc.tramsAndTasks}>
            <TramsTasksEditor
              trams={config.trams}
              tasks={config.tasks}
              memberNames={memberNames}
              onTrams={(trams) => set({ trams })}
              onTasks={(tasks) => set({ tasks })}
            />
          </Block>

          {/* — Encesses (Lluïments) — */}
          <Block label={t.foc.encesses}>
            <EncessesEditor
              encesses={config.encesses}
              memberNames={memberNames}
              onChange={(encesses) => set({ encesses })}
            />
          </Block>

          {/* — Responsables material — */}
          <Block label={t.foc.responsablesMaterial}>
            <StringList
              items={config.responsablesMaterial}
              memberNames={memberNames}
              onChange={(responsablesMaterial) => set({ responsablesMaterial })}
              addLabel={t.foc.addResponsable}
            />
          </Block>

          <Row gap={10}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 44, flex: 1 }}
              onClick={() => window.print()}
            >
              {t.foc.print}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: 44 }}
              onClick={resetSheet}
            >
              {t.foc.clear}
            </button>
          </Row>

          {/* Live preview — this is what gets printed. */}
          <div>
            <h4 style={{ fontSize: 14, margin: "4px 0 8px", opacity: 0.7 }}>{t.foc.preview}</h4>
            <FocSheet config={config} />
          </div>
        </Stack>
      ) : null}
    </div>
  );
}

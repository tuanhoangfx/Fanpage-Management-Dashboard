/**
 * HUB_UI_SCAFFOLD — directory template for P0023 Fanpage Dashboard.
 */
import { useMemo, useState } from "react";
import {
  HubDirectoryScreen,
  HubPaginatedDataTable,
  HubTableEmptyRow,
  type FilterDef,
  type FilterValues,
  type HubTableColumn,
} from "@tool-workspace/hub-ui";

const COLUMNS: HubTableColumn[] = [{ key: "name", label: "Page" }];

export function CatalogScreen() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const filters = useMemo<FilterDef[]>(() => [], []);

  const header = (
    <div className="app-tab-header px-6 py-3 text-sm text-[var(--muted)]">
      TODO: AppTabHeader — Fanpage list
    </div>
  );

  return (
    <HubDirectoryScreen
      header={header}
      filters={filters}
      query={query}
      onQueryChange={setQuery}
      filterValues={filterValues}
      onFilterValuesChange={setFilterValues}
      filterPlaceholder="Search fanpages…"
      filterShortcutScope="default"
      sectionRuleLabel="Pages"
    >
      <HubPaginatedDataTable
        columns={COLUMNS}
        items={[]}
        ariaLabel="Fanpage directory"
        empty={<HubTableEmptyRow colSpan={COLUMNS.length}>No pages yet</HubTableEmptyRow>}
        renderRow={() => null}
      />
    </HubDirectoryScreen>
  );
}

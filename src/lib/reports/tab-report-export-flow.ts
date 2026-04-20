import { Share } from 'react-native';

export type ReportsTabScope = 'admin' | 'client';

export type AdminReportsExportRow = {
  campaignTitle: string;
  clientName: string;
  driverName: string;
  campaignDate: string;
  status: string;
  photoCount: number;
  shiftCount: number;
};

export type ClientReportsExportRow = {
  campaignTitle: string;
  rangeLabel: string;
  photoCount: number;
  shiftCount: number;
  workedHours: number;
};

function escapeCsvField(value: string): string {
  const normalized = value.replaceAll('"', '""');
  return `"${normalized}"`;
}

function buildAdminReportsCsv(rows: AdminReportsExportRow[]): string {
  const header = ['Campaign', 'Client', 'Driver', 'Date', 'Status', 'Photos', 'Shifts'].join(',');

  const lines = rows.map((row) => {
    return [
      escapeCsvField(row.campaignTitle),
      escapeCsvField(row.clientName),
      escapeCsvField(row.driverName),
      escapeCsvField(row.campaignDate),
      escapeCsvField(row.status),
      row.photoCount.toString(),
      row.shiftCount.toString(),
    ].join(',');
  });

  return [header, ...lines].join('\n');
}

function buildClientReportsCsv(rows: ClientReportsExportRow[]): string {
  const header = ['Campaign', 'Range', 'Photos', 'Shifts', 'Worked Hours'].join(',');

  const lines = rows.map((row) => {
    return [
      escapeCsvField(row.campaignTitle),
      escapeCsvField(row.rangeLabel),
      row.photoCount.toString(),
      row.shiftCount.toString(),
      row.workedHours.toFixed(2),
    ].join(',');
  });

  return [header, ...lines].join('\n');
}

export async function exportReportsCsvForTab({
  scope,
  rows,
}: {
  scope: ReportsTabScope;
  rows: AdminReportsExportRow[] | ClientReportsExportRow[];
}): Promise<void> {
  if (rows.length === 0) {
    throw new Error('No report rows available to export');
  }

  const csv = scope === 'admin'
    ? buildAdminReportsCsv(rows as AdminReportsExportRow[])
    : buildClientReportsCsv(rows as ClientReportsExportRow[]);
  await Share.share({
    title: `${scope === 'admin' ? 'Admin' : 'Client'} reports export`,
    message: csv,
  });
}

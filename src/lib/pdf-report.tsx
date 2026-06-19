import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "node:path";

const fontDir = path.join(
  process.cwd(),
  "node_modules",
  "@fontsource",
  "noto-sans-jp",
  "files",
);

let fontRegistered = false;
function registerFont() {
  if (fontRegistered) return;
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: path.join(fontDir, "noto-sans-jp-japanese-400-normal.woff") },
      {
        src: path.join(fontDir, "noto-sans-jp-japanese-700-normal.woff"),
        fontWeight: 700,
      },
    ],
  });
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "NotoSansJP",
    fontSize: 10,
    color: "#0f172a",
  },
  header: {
    textAlign: "center",
    borderBottom: 2,
    borderColor: "#0ea5e9",
    paddingBottom: 8,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 700 },
  subtitle: { fontSize: 11, color: "#475569", marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    backgroundColor: "#f1f5f9",
    padding: 5,
    marginBottom: 6,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryItem: {
    flex: 1,
    padding: 8,
    margin: 2,
    backgroundColor: "#f8fafc",
    border: 1,
    borderColor: "#e2e8f0",
  },
  summaryLabel: { fontSize: 9, color: "#64748b" },
  summaryValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  table: { borderTop: 1, borderColor: "#cbd5e1" },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#e2e8f0",
    padding: 4,
  },
  rowHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    fontWeight: 700,
  },
  cell: { flex: 1, fontSize: 9 },
  cellRight: { flex: 1, fontSize: 9, textAlign: "right" },
  comment: {
    backgroundColor: "#eff6ff",
    border: 1,
    borderColor: "#bfdbfe",
    padding: 10,
    fontSize: 10,
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

interface ReportData {
  date: string;
  aggregates: Array<{
    pondId: string;
    pondName: string;
    pondCode: string;
    feed: number;
    production: number;
    mortality: number;
    fcr: number | null;
  }>;
  feedingLogs: Array<{ pondName: string; feedName: string; amountKg: number }>;
  productionLogs: Array<{
    pondName: string;
    speciesName: string;
    harvestedCount: number;
    harvestedWeightKg: number;
    mortalityCount: number;
  }>;
  totals: { feed: number; production: number; mortality: number };
  aiComment: string;
}

function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>養魚場 日次報告書</Text>
          <Text style={styles.subtitle}>対象日: {data.date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. サマリー</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>給餌総量</Text>
              <Text style={styles.summaryValue}>
                {data.totals.feed.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>生産総量</Text>
              <Text style={styles.summaryValue}>
                {data.totals.production.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>死亡数</Text>
              <Text style={styles.summaryValue}>{data.totals.mortality} 匹</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. AIコメント</Text>
          <View style={styles.comment}>
            <Text>{data.aiComment}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 池別集計</Text>
          <View style={styles.table}>
            <View style={styles.rowHeader}>
              <Text style={styles.cell}>池</Text>
              <Text style={styles.cellRight}>給餌kg</Text>
              <Text style={styles.cellRight}>生産kg</Text>
              <Text style={styles.cellRight}>死亡</Text>
              <Text style={styles.cellRight}>FCR</Text>
            </View>
            {data.aggregates.map((a, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cell}>
                  [{a.pondCode}] {a.pondName}
                </Text>
                <Text style={styles.cellRight}>{a.feed.toFixed(1)}</Text>
                <Text style={styles.cellRight}>{a.production.toFixed(1)}</Text>
                <Text style={styles.cellRight}>{a.mortality}</Text>
                <Text style={styles.cellRight}>
                  {a.fcr != null ? a.fcr.toFixed(2) : "-"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {data.feedingLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              4. 給餌記録 ({data.feedingLogs.length}件)
            </Text>
            <View style={styles.table}>
              <View style={styles.rowHeader}>
                <Text style={styles.cell}>池</Text>
                <Text style={styles.cell}>飼料</Text>
                <Text style={styles.cellRight}>給餌量(kg)</Text>
              </View>
              {data.feedingLogs.map((l, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{l.pondName}</Text>
                  <Text style={styles.cell}>{l.feedName}</Text>
                  <Text style={styles.cellRight}>{l.amountKg.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.productionLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              5. 生産記録 ({data.productionLogs.length}件)
            </Text>
            <View style={styles.table}>
              <View style={styles.rowHeader}>
                <Text style={styles.cell}>池</Text>
                <Text style={styles.cell}>魚種</Text>
                <Text style={styles.cellRight}>出荷数</Text>
                <Text style={styles.cellRight}>出荷kg</Text>
                <Text style={styles.cellRight}>死亡</Text>
              </View>
              {data.productionLogs.map((l, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{l.pondName}</Text>
                  <Text style={styles.cell}>{l.speciesName}</Text>
                  <Text style={styles.cellRight}>{l.harvestedCount}</Text>
                  <Text style={styles.cellRight}>
                    {l.harvestedWeightKg.toFixed(1)}
                  </Text>
                  <Text style={styles.cellRight}>{l.mortalityCount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          養魚場管理システム — 出力日時: {new Date().toLocaleString("ja-JP")}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderDailyReportPDF(data: ReportData): Promise<Buffer> {
  registerFont();
  return renderToBuffer(<ReportDocument data={data} />);
}

interface PeriodReportData {
  title: string;
  periodKey: string;
  rangeLabel: string;
  totals: { feed: number; production: number; mortality: number };
  aggregates: Array<{
    pondCode: string;
    pondName: string;
    feed: number;
    production: number;
    mortality: number;
    fcr: number | null;
  }>;
  bySpecies: Array<{ name: string; count: number; production: number; mortality: number }>;
  aiComment: string;
}

function PeriodReportDocument({ data }: { data: PeriodReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>
            対象: {data.periodKey} ({data.rangeLabel})
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 期間サマリー</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>給餌総量</Text>
              <Text style={styles.summaryValue}>{data.totals.feed.toFixed(1)} kg</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>生産総量</Text>
              <Text style={styles.summaryValue}>{data.totals.production.toFixed(1)} kg</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>死亡数</Text>
              <Text style={styles.summaryValue}>{data.totals.mortality} 匹</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. AIコメント</Text>
          <View style={styles.comment}>
            <Text>{data.aiComment}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 池別集計</Text>
          <View style={styles.table}>
            <View style={styles.rowHeader}>
              <Text style={styles.cell}>池</Text>
              <Text style={styles.cellRight}>給餌kg</Text>
              <Text style={styles.cellRight}>生産kg</Text>
              <Text style={styles.cellRight}>死亡</Text>
              <Text style={styles.cellRight}>FCR</Text>
            </View>
            {data.aggregates.map((a, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cell}>
                  [{a.pondCode}] {a.pondName}
                </Text>
                <Text style={styles.cellRight}>{a.feed.toFixed(1)}</Text>
                <Text style={styles.cellRight}>{a.production.toFixed(1)}</Text>
                <Text style={styles.cellRight}>{a.mortality}</Text>
                <Text style={styles.cellRight}>
                  {a.fcr != null ? a.fcr.toFixed(2) : "-"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {data.bySpecies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. 魚種別集計</Text>
            <View style={styles.table}>
              <View style={styles.rowHeader}>
                <Text style={styles.cell}>魚種</Text>
                <Text style={styles.cellRight}>出荷尾数</Text>
                <Text style={styles.cellRight}>出荷kg</Text>
                <Text style={styles.cellRight}>死亡</Text>
              </View>
              {data.bySpecies.map((s, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{s.name}</Text>
                  <Text style={styles.cellRight}>{s.count.toLocaleString()}</Text>
                  <Text style={styles.cellRight}>{s.production.toFixed(1)}</Text>
                  <Text style={styles.cellRight}>{s.mortality}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          養魚場管理システム — 出力日時: {new Date().toLocaleString("ja-JP")}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPeriodReportPDF(data: PeriodReportData): Promise<Buffer> {
  registerFont();
  return renderToBuffer(<PeriodReportDocument data={data} />);
}

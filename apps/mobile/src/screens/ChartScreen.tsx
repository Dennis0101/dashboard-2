import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../app/theme";
import { H1, P, Panel, Screen } from "../ui/Primitives";
import { apiGet } from "../api/client";

const TIMEFRAMES = ["5s", "15s", "1m", "5m", "1h", "1d", "1w", "1y"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export function ChartScreen() {
  const { colors } = useTheme();
  const [tf, setTf] = useState<Timeframe>("1m");
  const [type, setType] = useState<"candles" | "heikin" | "bars">("candles");
  const webRef = useRef<WebView>(null);

  type TradeEvent = {
    id: string;
    type: "ENTRY" | "EXIT" | "REJECT" | "HALT" | "INFO";
    side: "LONG" | "SHORT" | null;
    price: number | null;
    pnl: number | null;
    createdAt: string;
    reasonDetail: string | null;
  };

  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<TradeEvent[]>(`/v1/trades/events?symbol=BTCUSDT&timeframe=${encodeURIComponent(tf)}`);
        setEvents(res);
        const t = await apiGet<any[]>(`/v1/trades?symbol=BTCUSDT&timeframe=${encodeURIComponent(tf)}&limit=50`);
        setTrades(t);
      } catch {
        setEvents([]);
        setTrades([]);
      }
    })();
  }, [tf]);

  const html = useMemo(() => {
    // TradingView Lightweight Charts를 WebView로 띄우는 최소 골격.
    // 다음 단계: 서버의 OHLCV + 트레이드 마커(진입/청산/연결선/PnL)로 실제 렌더링.
    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body { margin:0; padding:0; background:${colors.bg}; }
      #c { width:100vw; height:60vh; }
      .hint { color:${colors.subtext}; font-family: -apple-system, system-ui; padding:12px; font-size:12px; }
    </style>
    <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
  </head>
  <body>
    <div id="c"></div>
    <div class="hint">Chart type: ${type} • TF: ${tf} • markers: server-driven</div>
    <script>
      const chart = LightweightCharts.createChart(document.getElementById('c'), {
        layout: { background: { type: 'solid', color: '${colors.bg}' }, textColor: '${colors.subtext}' },
        grid: { vertLines: { color: '${colors.border}' }, horzLines: { color: '${colors.border}' } },
        rightPriceScale: { borderColor: '${colors.border}' },
        timeScale: { borderColor: '${colors.border}' }
      });
      const series = (${type} === 'bars')
        ? chart.addBarSeries()
        : chart.addCandlestickSeries();
      series.setData([
        { time: 1710000000, open: 100, high: 110, low: 90, close: 105 },
        { time: 1710000060, open: 105, high: 112, low: 100, close: 108 },
        { time: 1710000120, open: 108, high: 115, low: 107, close: 111 },
        { time: 1710000180, open: 111, high: 113, low: 104, close: 106 },
      ]);

      function setTradeMarkers(events) {
        const markers = (events || [])
          .filter(e => e.price != null)
          .map(e => {
            const t = Math.floor(new Date(e.createdAt).getTime() / 1000);
            const isEntry = e.type === 'ENTRY';
            const isExit = e.type === 'EXIT';
            const side = e.side || '';
            const text = isEntry
              ? (side + ' entry')
              : isExit
                ? ('exit ' + (e.pnl != null ? ('pnl=' + e.pnl) : ''))
                : e.type;
            return {
              time: t,
              position: isEntry ? 'belowBar' : 'aboveBar',
              shape: isEntry ? 'arrowUp' : 'arrowDown',
              color: isEntry ? '${colors.success}' : '${colors.danger}',
              text
            };
          });
        series.setMarkers(markers);
      }

      function setTradeLines(trades) {
        // lightweight-charts doesn't support multi-segment overlays easily without many series.
        // For now: draw the most recent CLOSED trade as a 2-point line (entry->exit) as a proof baseline.
        const closed = (trades || []).find(t => t.status === 'CLOSED' && t.entry && t.exit);
        if (!closed) return;
        const line = chart.addLineSeries({ color: (closed.pnl && closed.pnl.net >= 0) ? '${colors.success}' : '${colors.danger}', lineWidth: 2 });
        line.setData([
          { time: Math.floor(new Date(closed.entry.ts).getTime() / 1000), value: closed.entry.price },
          { time: Math.floor(new Date(closed.exit.ts).getTime() / 1000), value: closed.exit.price },
        ]);
      }

      window.__setTradeMarkers = setTradeMarkers;
      window.__setTradeLines = setTradeLines;
      chart.timeScale().fitContent();
    </script>
  </body>
</html>`;
  }, [colors.bg, colors.border, colors.subtext, tf, type]);

  useEffect(() => {
    // Push markers into WebView after it loads.
    const payload = JSON.stringify(events);
    const js = `window.__setTradeMarkers && window.__setTradeMarkers(${payload}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [events]);

  useEffect(() => {
    const payload = JSON.stringify(trades);
    const js = `window.__setTradeLines && window.__setTradeLines(${payload}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [trades]);

  return (
    <Screen>
      <H1>Chart</H1>
      <P>모든 매매는 차트에서 증명 가능해야 합니다. (진입/청산 시간·방향·연결선·PnL)</P>

      <Panel style={{ marginTop: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {TIMEFRAMES.map((v) => (
            <Chip key={v} label={v} active={v === tf} onPress={() => setTf(v)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <Chip label="Candles" active={type === "candles"} onPress={() => setType("candles")} />
          <Chip label="Heikin" active={type === "heikin"} onPress={() => setType("heikin")} />
          <Chip label="Bars" active={type === "bars"} onPress={() => setType("bars")} />
        </ScrollView>

        <View style={{ height: 380, marginTop: 10, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
          <WebView ref={webRef} originWhitelist={["*"]} source={{ html }} />
        </View>
      </Panel>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
        backgroundColor: active ? "rgba(77,163,255,0.14)" : "transparent"
      }}
    >
      <Text style={{ color: active ? colors.text : colors.subtext, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 }
});


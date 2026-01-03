import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../app/theme";
import { H1, P, Panel, Screen } from "../ui/Primitives";

const TIMEFRAMES = ["5s", "15s", "1m", "5m", "1h", "1d", "1w", "1y"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export function ChartScreen() {
  const { colors } = useTheme();
  const [tf, setTf] = useState<Timeframe>("1m");
  const [type, setType] = useState<"candles" | "heikin" | "bars">("candles");

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
    <div class="hint">Chart type: ${type} • TF: ${tf} • markers: placeholder</div>
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
      chart.timeScale().fitContent();
    </script>
  </body>
</html>`;
  }, [colors.bg, colors.border, colors.subtext, tf, type]);

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
          <WebView originWhitelist={["*"]} source={{ html }} />
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


import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { apiGet } from "../api/client";
import { H1, P, Panel, Screen } from "../ui/Primitives";

type TradeEvent = {
  id: string;
  symbol: string;
  timeframe: string;
  type: "ENTRY" | "EXIT" | "REJECT" | "HALT" | "INFO";
  side: "LONG" | "SHORT" | null;
  price: number | null;
  qty: number | null;
  pnl: number | null;
  reasonCode: string | null;
  reasonDetail: string | null;
  exchangeTs: string | null;
  createdAt: string;
};

export function TradesScreen() {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<TradeEvent[]>("/v1/trades/events?symbol=BTCUSDT&timeframe=1m");
        setEvents(res);
        const t = await apiGet<any[]>("/v1/trades?symbol=BTCUSDT&timeframe=1m&limit=50");
        setTrades(t);
      } catch {
        // backend not running yet
      }
    })();
  }, []);

  return (
    <Screen>
      <H1>Trades</H1>
      <P>모든 트레이드 기록은 숨김 없이 제공되어야 합니다. (진입/청산/거절/중단 포함)</P>

      <Panel style={{ marginTop: 12 }}>
        <H1 style={{ fontSize: 16 }}>Grouped trades (proof)</H1>
        {trades.length === 0 ? (
          <P style={{ marginTop: 8 }}>서버 연결 전이거나 트레이드가 없습니다.</P>
        ) : (
          <ScrollView style={{ marginTop: 8, maxHeight: 240 }}>
            {trades.map((t) => (
              <Pressable key={t.id} onPress={() => setSelected(t)} style={{ marginBottom: 12 }}>
                <P>
                  {t.status} • {t.side} • {t.symbol} • {t.timeframe}
                </P>
                <P>
                  entry: {t.entry?.price ?? "-"} exit: {t.exit?.price ?? "-"} netPnL: {t.pnl?.net ?? "-"}
                </P>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </Panel>

      {selected ? (
        <Panel style={{ marginTop: 12 }}>
          <H1 style={{ fontSize: 16 }}>Trade detail</H1>
          <P>ID: {selected.id}</P>
          {selected.entryReason ? <P>{selected.entryReason}</P> : null}
          {selected.exitReason ? <P>{selected.exitReason}</P> : null}
        </Panel>
      ) : null}

      <Panel style={{ marginTop: 12 }}>
        <H1 style={{ fontSize: 16 }}>Raw events</H1>
        {events.length === 0 ? (
          <>
            <P>서버 연결 전이거나 이벤트가 없습니다.</P>
            <P>연결되면 trade_events가 시간순으로 표시됩니다.</P>
          </>
        ) : (
          <ScrollView style={{ marginTop: 8, maxHeight: 260 }}>
            {events.map((e) => (
              <View key={e.id} style={{ marginBottom: 12 }}>
                <P>
                  {e.type}
                  {e.side ? ` • ${e.side}` : ""} • {e.symbol} • {e.timeframe}
                </P>
                <P>
                  price: {e.price ?? "-"} qty: {e.qty ?? "-"} pnl: {e.pnl ?? "-"}
                </P>
                <P>{new Date(e.createdAt).toLocaleString()}</P>
                {e.reasonDetail ? <P>{e.reasonDetail}</P> : null}
              </View>
            ))}
          </ScrollView>
        )}
      </Panel>
    </Screen>
  );
}


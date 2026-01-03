import React from "react";
import { H1, P, Panel, Screen } from "../ui/Primitives";

export function TradesScreen() {
  return (
    <Screen>
      <H1>Trades</H1>
      <P>모든 트레이드 기록은 숨김 없이 제공되어야 합니다. (진입/청산/거절/중단 포함)</P>

      <Panel style={{ marginTop: 12 }}>
        <P>Placeholder: 서버의 trade_events 타임라인을 여기에 표시합니다.</P>
        <P>각 항목 클릭 시: “왜 진입/왜 청산” + PnL 계산 근거</P>
      </Panel>
    </Screen>
  );
}


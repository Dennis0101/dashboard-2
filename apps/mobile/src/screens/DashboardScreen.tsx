import React from "react";
import { View } from "react-native";
import { Button, H1, P, Panel, Screen } from "../ui/Primitives";
import { clearSessionToken } from "../state/session";

export function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <Screen>
      <H1>Dashboard</H1>
      <P>처음 열자마자 이해되는 구조를 목표로, “현재 상태/리스크/무엇을 하는지”를 가장 먼저 보여줍니다.</P>

      <View style={{ marginTop: 12 }}>
        <Panel>
          <H1 style={{ fontSize: 16 } as any}>Bot Status</H1>
          <P>현재: Idle (서버 상태 연결 예정)</P>
          <P>불확실 상태 감지 시: 자동매매 중단</P>
        </Panel>
      </View>

      <Button
        variant="secondary"
        label="Logout"
        onPress={async () => {
          await clearSessionToken();
          onLogout();
        }}
      />
    </Screen>
  );
}


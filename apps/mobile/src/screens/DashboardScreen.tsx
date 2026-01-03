import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, H1, P, Panel, Screen } from "../ui/Primitives";
import { clearSessionToken } from "../state/session";
import { apiPost } from "../api/client";
import { getRefreshToken } from "../state/session";
import { apiGet } from "../api/client";

export function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [status, setStatus] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<any>("/v1/status");
        setStatus(res);
      } catch {
        setStatus(null);
      }
    })();
  }, []);

  return (
    <Screen>
      <H1>Dashboard</H1>
      <P>처음 열자마자 이해되는 구조를 목표로, “현재 상태/리스크/무엇을 하는지”를 가장 먼저 보여줍니다.</P>

      <View style={{ marginTop: 12 }}>
        <Panel>
          <H1 style={{ fontSize: 16 } as any}>Bot Status</H1>
          {status ? (
            <>
              <P>tier: {status.tier}</P>
              <P>autoTrading: {status.autoTrading}</P>
              {status.lastEvent ? (
                <P>
                  last: {status.lastEvent.type} • {status.lastEvent.reasonCode ?? "-"} • {status.lastEvent.reasonDetail ?? "-"}
                </P>
              ) : (
                <P>last: -</P>
              )}
            </>
          ) : (
            <>
              <P>현재: Unknown (서버 미연결)</P>
              <P>불확실 상태 감지 시: 자동매매 중단</P>
            </>
          )}
        </Panel>
      </View>

      <Button
        variant="secondary"
        label="Logout"
        onPress={async () => {
          try {
            const rt = await getRefreshToken();
            if (rt) await apiPost("/auth/logout", { refreshToken: rt });
          } catch {
            // ignore network failures; still clear local tokens
          }
          await clearSessionToken();
          onLogout();
        }}
      />
    </Screen>
  );
}


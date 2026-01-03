import React, { useEffect, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { H1, P, Panel, Screen, Button } from "../ui/Primitives";
import { useTheme } from "../app/theme";
import { apiGet, apiPost } from "../api/client";

type StoredKey = {
  id: string;
  exchange: string;
  maskedHint: string;
  createdAt: string;
  revokedAt: string | null;
};

export function SettingsScreen() {
  const { colors } = useTheme();
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [keys, setKeys] = useState<StoredKey[]>([]);

  async function refresh() {
    try {
      const res = await apiGet<StoredKey[]>("/v1/exchange-keys");
      setKeys(res);
    } catch {
      // ignore until backend is running
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Screen>
      <H1>Settings</H1>
      <P>API 키는 절대 재조회할 수 없으며, 마스킹으로만 표시됩니다. 출금 권한 없는 키만 허용됩니다.</P>

      <Panel style={{ marginTop: 12 }}>
        <P>Exchange</P>
        <TextInput
          value={exchange}
          onChangeText={setExchange}
          autoCapitalize="none"
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text
          }}
          placeholderTextColor={colors.subtext}
        />

        <View style={{ marginTop: 12 }}>
          <P>API Key (입력 후 저장하면 다시 볼 수 없음)</P>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text
            }}
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <P>API Secret</P>
          <TextInput
            value={apiSecret}
            onChangeText={setApiSecret}
            autoCapitalize="none"
            secureTextEntry
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text
            }}
            placeholderTextColor={colors.subtext}
          />
        </View>

        <Button
          label="Save API Key (server)"
          onPress={async () => {
            try {
              if (!apiKey || !apiSecret) {
                Alert.alert("Missing", "API Key / Secret을 입력하세요.");
                return;
              }
              const res = await apiPost<{ id: string; exchange: string; maskedHint: string }>(
                "/v1/exchange-keys",
                { exchange, apiKey, apiSecret }
              );
              setApiKey("");
              setApiSecret("");
              Alert.alert("Saved", `${res.exchange} • ${res.maskedHint}\n(원문 키는 다시 볼 수 없습니다)`);
              await refresh();
            } catch (e) {
              Alert.alert("Save failed", e instanceof Error ? e.message : "unknown_error");
            }
          }}
        />

        <Button
          variant="secondary"
          label="Safety checklist"
          onPress={() =>
            Alert.alert(
              "필수 체크",
              [
                "- 출금 권한 OFF",
                "- IP 화이트리스트(가능한 경우)",
                "- 최소 권한(선물 주문/조회만)",
                "- 키 유출 의심 시 즉시 폐기"
              ].join("\n")
            )
          }
        />
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <H1 style={{ fontSize: 16 }}>Saved keys</H1>
        {keys.length === 0 ? (
          <P style={{ marginTop: 8 }}>서버에 저장된 키가 없습니다(또는 서버 미연결).</P>
        ) : (
          keys.map((k) => (
            <View key={k.id} style={{ marginTop: 10 }}>
              <P>
                {k.exchange} • {k.maskedHint}
              </P>
              <P>{new Date(k.createdAt).toLocaleString()}</P>
            </View>
          ))
        )}
      </Panel>
    </Screen>
  );
}


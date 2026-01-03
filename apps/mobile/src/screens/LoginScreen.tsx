import React, { useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { apiPost } from "../api/client";
import { setSessionToken } from "../state/session";
import { Button, H1, P, Panel, Screen } from "../ui/Primitives";
import { useTheme } from "../app/theme";

// NOTE: 실제 Apple/Google 로그인은 다음 단계에서 연결합니다.
// 현재는 서버의 dev 토큰(`dev:<subject>`) 경로로 UI/플로우를 먼저 고정합니다.

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { colors } = useTheme();
  const [devSubject, setDevSubject] = useState("user_001");

  return (
    <Screen>
      <Panel>
        <H1>Sign in</H1>
        <P>보안을 위해 자동매매/AI는 서버에서만 실행됩니다. 앱은 제어·시각화·설정만 합니다.</P>

        <View style={{ marginTop: 12 }}>
          <P>개발용 Subject (임시)</P>
          <TextInput
            value={devSubject}
            onChangeText={setDevSubject}
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
            placeholder="user_001"
          />
        </View>

        <Button
          label="Continue (dev)"
          onPress={async () => {
            try {
              const res = await apiPost<{ sessionToken: string }>("/auth/login", {
                provider: "google",
                idToken: `dev:${devSubject}`
              });
              await setSessionToken(res.sessionToken);
              onLoggedIn();
            } catch (e) {
              Alert.alert("Login failed", e instanceof Error ? e.message : "unknown_error");
            }
          }}
        />

        <Button
          variant="secondary"
          label="Sign in with Google (coming soon)"
          onPress={() => Alert.alert("Not yet", "다음 단계에서 OAuth를 연결합니다.")}
        />
        <Button
          variant="secondary"
          label="Sign in with Apple (coming soon)"
          onPress={() => Alert.alert("Not yet", "다음 단계에서 OAuth를 연결합니다.")}
        />
      </Panel>
    </Screen>
  );
}


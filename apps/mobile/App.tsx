import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/app/AppNavigator";
import { AppThemeProvider } from "./src/app/theme";

export default function App() {
  return (
    <AppThemeProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AppThemeProvider>
  );
}

import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAppStore } from "../store/AppStore";
import { colors } from "../theme/colors";
import AuthNavigator from "./AuthNavigator";
import PatientNavigator from "./PatientNavigator";

export default function RootNavigator() {
  const { ready, session } = useAppStore();
  if (!ready) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }
  return <NavigationContainer>{session.role === "paciente" ? <PatientNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

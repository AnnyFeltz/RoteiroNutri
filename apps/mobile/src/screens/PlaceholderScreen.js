import { View, Text } from "react-native";
import { Screen, Muted } from "../components/ui/UI";
import { colors, spacing } from "../theme/colors";

// Scaffold: navega certinho, conteúdo ainda por construir (ver MOBILE_MIGRATION_NOTES.md).
export default function PlaceholderScreen({ route }) {
  const { title, description } = route.params ?? {};
  return (
    <Screen style={{ alignItems: "center", justifyContent: "center", padding: spacing(6) }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, marginBottom: spacing(4) }} />
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>{title ?? "Em construção"}</Text>
      <Muted style={{ textAlign: "center", marginTop: spacing(2) }}>{description ?? "Essa tela ainda está no roteiro de implementação."}</Muted>
    </Screen>
  );
}

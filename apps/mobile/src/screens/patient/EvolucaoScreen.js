import { ScrollView, View, Text } from "react-native";
import { Screen, H1, Muted, Card } from "../../components/ui/UI";
import { colors, spacing } from "../../theme/colors";
import { useAppStore } from "../../store/AppStore";

const CHART_HEIGHT = 140;

export default function EvolucaoScreen() {
  const { session, getPatient } = useAppStore();
  const patient = getPatient(session.patientId);
  const evolution = patient?.evolution ?? [];

  if (evolution.length === 0) {
    return (
      <Screen style={{ padding: spacing(6), paddingTop: 64 }}>
        <H1>Evolução</H1>
        <Muted style={{ marginTop: spacing(3) }}>Ainda não há histórico de peso registrado.</Muted>
      </Screen>
    );
  }
  const weights = evolution.map((e) => e.weight);
  const min = Math.min(...weights), max = Math.max(...weights), range = max - min || 1;
  const last = weights[weights.length - 1], diff = last - weights[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(5), paddingTop: 64 }}>
        <H1>Evolução de peso</H1>
        <Muted style={{ marginTop: spacing(1), marginBottom: spacing(5) }}>
          {diff <= 0 ? `${Math.abs(diff).toFixed(1)}kg a menos` : `${diff.toFixed(1)}kg a mais`} desde o início
        </Muted>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT + 20, gap: spacing(2) }}>
            {evolution.map((e, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
                <View style={{ width: "100%", height: 24 + ((e.weight - min) / range) * (CHART_HEIGHT - 24), backgroundColor: colors.leaf, borderRadius: 6 }} />
                <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: spacing(1) }}>{e.month}</Text>
              </View>
            ))}
          </View>
        </Card>
        <View style={{ marginTop: spacing(5), flexDirection: "row", gap: spacing(3) }}>
          <Card style={{ flex: 1, alignItems: "center" }}><Muted>Peso atual</Muted><Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>{last}kg</Text></Card>
          <Card style={{ flex: 1, alignItems: "center" }}><Muted>Meta</Muted><Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>{patient?.targetWeightKg ?? "-"}kg</Text></Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

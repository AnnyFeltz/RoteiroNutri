import { ScrollView, View, Text } from "react-native";
import { Trophy, Flame, Target } from "lucide-react-native";
import { Screen, H1, Muted, Card } from "../../components/ui/UI";
import { colors, spacing } from "../../theme/colors";
import { useAppStore } from "../../store/AppStore";

export default function ConquistasScreen() {
  const { session, getActivePlan, getPatient } = useAppStore();
  const plan = getActivePlan(session.patientId);
  const patient = getPatient(session.patientId);
  const done = plan?.adherenceLog?.today?.length ?? 0;
  const total = plan?.meals?.length ?? 0;
  const current = patient?.evolution?.at(-1)?.weight ?? patient?.weightKg;
  const lost = patient?.initialWeightKg != null && current != null ? patient.initialWeightKg - current : 0;

  const items = [
    { icon: Flame, label: "Adesão de hoje", value: total ? `${Math.round((done / total) * 100)}%` : "-" },
    { icon: Target, label: "Variação desde o início", value: lost ? `${Math.abs(lost).toFixed(1)}kg ${lost > 0 ? "a menos" : "a mais"}` : "Começando" },
    { icon: Trophy, label: "Sequência de dias", value: "Em breve" },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(5), paddingTop: 64 }}>
        <H1>Conquistas</H1>
        <Muted style={{ marginTop: spacing(1), marginBottom: spacing(5) }}>Seu progresso até aqui.</Muted>
        {items.map(({ icon: Icon, label, value }) => (
          <Card key={label} style={{ marginBottom: spacing(3), flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={colors.leaf} />
            </View>
            <View style={{ marginLeft: spacing(3) }}>
              <Text style={{ fontWeight: "700", fontSize: 18, color: colors.foreground }}>{value}</Text>
              <Muted>{label}</Muted>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

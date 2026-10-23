import { ScrollView, View, Text, Pressable } from "react-native";
import { User, History, Bell, Shield, LogOut, ChevronRight } from "lucide-react-native";
import { Screen, H1, Muted, Card } from "../../components/ui/UI";
import { colors, spacing } from "../../theme/colors";
import { useAppStore } from "../../store/AppStore";

const ITEMS = [
  { icon: User, label: "Editar dados", screen: "PerfilEditar" },
  { icon: History, label: "Histórico de alterações", screen: "PerfilHistorico" },
  { icon: Bell, label: "Notificações", screen: "PerfilNotificacoes" },
  { icon: Shield, label: "Privacidade", screen: "PerfilPrivacidade" },
];

export default function PerfilScreen({ navigation }) {
  const { session, getPatient, logout } = useAppStore();
  const patient = getPatient(session.patientId);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(5), paddingTop: 64 }}>
        <View style={{ alignItems: "center", marginBottom: spacing(6) }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: patient?.avatarColor ?? colors.leaf, alignItems: "center", justifyContent: "center", marginBottom: spacing(3) }}>
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>{(patient?.name ?? "?").charAt(0)}</Text>
          </View>
          <H1 style={{ fontSize: 20 }}>{patient?.name ?? "Paciente"}</H1>
          <Muted>{patient?.email}</Muted>
        </View>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {ITEMS.map(({ icon: Icon, label, screen }, i) => (
            <Pressable key={label} onPress={() => navigation.navigate(screen)} style={{ flexDirection: "row", alignItems: "center", padding: spacing(4), borderBottomWidth: i < ITEMS.length - 1 ? 1 : 0, borderColor: colors.border }}>
              <Icon size={18} color={colors.foreground} />
              <Text style={{ marginLeft: spacing(3), flex: 1, color: colors.foreground, fontSize: 15 }}>{label}</Text>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </Card>
        <Pressable onPress={logout} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing(6), padding: spacing(3) }}>
          <LogOut size={16} color={colors.destructive} />
          <Text style={{ marginLeft: spacing(2), color: colors.destructive, fontWeight: "600" }}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

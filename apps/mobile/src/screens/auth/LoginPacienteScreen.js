import { useState } from "react";
import { ScrollView, Alert, KeyboardAvoidingView, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, H1, Muted, Label, Input, Button } from "../../components/ui/UI";
import { colors, gradients, spacing } from "../../theme/colors";
import { useAppStore } from "../../store/AppStore";

export default function LoginPacienteScreen({ navigation }) {
  const { loginPatient } = useAppStore();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const result = await loginPatient(email, pwd);
    setLoading(false);
    if (!result.ok) Alert.alert("Não foi possível entrar", result.error);
  };

  return (
    <Screen>
      <LinearGradient colors={gradients.leaf} style={{ paddingTop: 72, paddingBottom: 32, paddingHorizontal: spacing(6) }}>
        <Text style={{ color: colors.primaryForeground, fontSize: 22, fontWeight: "700" }}>Roteiro Nutri</Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: spacing(2) }}>Seu plano alimentar, na palma da mão.</Text>
      </LinearGradient>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing(6) }} keyboardShouldPersistTaps="handled">
          <H1>Acesse seu plano</H1>
          <Muted style={{ marginTop: spacing(2), marginBottom: spacing(6) }}>Use as credenciais fornecidas pelo seu nutricionista.</Muted>
          <Label>E-mail</Label>
          <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: spacing(4) }} />
          <Label>Senha</Label>
          <Input value={pwd} onChangeText={setPwd} secureTextEntry style={{ marginBottom: spacing(2) }} />
          <Text onPress={() => navigation.navigate("ForgotPassword")} style={{ color: colors.primary, fontSize: 13, marginBottom: spacing(6), alignSelf: "flex-end" }}>Esqueci minha senha</Text>
          <Button title="Entrar" onPress={submit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

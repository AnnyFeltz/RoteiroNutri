import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { Screen, H1, Muted, Label, Input, Button } from "../../components/ui/UI";
import { spacing } from "../../theme/colors";
import { authApi } from "../../lib/api-client";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await authApi.solicitarRecuperacaoSenha({ email });
      setSent(true);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a solicitação agora.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: spacing(6), paddingTop: 96 }}>
          <H1 style={{ textAlign: "center" }}>Confira seu e-mail</H1>
          <Muted style={{ textAlign: "center", marginTop: spacing(3), marginBottom: spacing(6) }}>Se {email} estiver cadastrado, enviamos um link de redefinição para lá.</Muted>
          <Button title="Já tenho o token" onPress={() => navigation.navigate("ResetPassword")} style={{ marginBottom: spacing(3) }} />
          <Button title="Voltar ao login" variant="outline" onPress={() => navigation.navigate("LoginPaciente")} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(6), paddingTop: 96 }}>
        <H1>Recuperar senha</H1>
        <Muted style={{ marginTop: spacing(2), marginBottom: spacing(6) }}>Enviaremos um link seguro para o e-mail cadastrado.</Muted>
        <Label>E-mail</Label>
        <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: spacing(6) }} />
        <Button title="Enviar link" onPress={submit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

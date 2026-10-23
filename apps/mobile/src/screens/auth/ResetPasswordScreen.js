import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { Screen, H1, Muted, Label, Input, Button } from "../../components/ui/UI";
import { spacing } from "../../theme/colors";
import { authApi } from "../../lib/api-client";

// Enquanto o back não envia e-mail, o token (logado no console do backend) é colado aqui.
export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) return Alert.alert("Token obrigatório", "Cole o token recebido por e-mail.");
    if (pwd.length < 8) return Alert.alert("Senha muito curta", "A senha deve ter ao menos 8 caracteres.");
    if (pwd !== confirm) return Alert.alert("Senhas diferentes", "As senhas não conferem.");
    setLoading(true);
    try {
      await authApi.redefinirSenha({ token, novaSenha: pwd });
      Alert.alert("Pronto!", "Senha redefinida com sucesso.", [{ text: "Ir para login", onPress: () => navigation.navigate("LoginPaciente") }]);
    } catch (err) {
      Alert.alert("Erro", err.message ?? "Token inválido ou expirado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(6), paddingTop: 96 }} keyboardShouldPersistTaps="handled">
        <H1>Redefinir senha</H1>
        <Muted style={{ marginTop: spacing(2), marginBottom: spacing(6) }}>Escolha uma nova senha segura para sua conta.</Muted>
        <Label>Token de recuperação</Label>
        <Input value={token} onChangeText={setToken} autoCapitalize="none" placeholder="Cole aqui o token recebido" style={{ marginBottom: spacing(4) }} />
        <Label>Nova senha</Label>
        <Input value={pwd} onChangeText={setPwd} secureTextEntry style={{ marginBottom: spacing(4) }} />
        <Label>Confirmar nova senha</Label>
        <Input value={confirm} onChangeText={setConfirm} secureTextEntry style={{ marginBottom: spacing(6) }} />
        <Button title="Redefinir senha" onPress={submit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

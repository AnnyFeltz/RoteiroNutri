import { Text, View, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing } from "../../theme/colors";

export const Screen = ({ children, style }) => <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>{children}</View>;
export const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;
export const H1 = ({ children, style }) => <Text style={[styles.h1, style]}>{children}</Text>;
export const Muted = ({ children, style }) => <Text style={[styles.muted, style]}>{children}</Text>;
export const Label = ({ children, style }) => <Text style={[styles.label, style]}>{children}</Text>;

export function Input({ style, ...props }) {
  return <TextInput placeholderTextColor={colors.mutedForeground} style={[styles.input, style]} {...props} />;
}

export function Button({ title, onPress, loading, variant = "primary", disabled, style }) {
  const outline = variant === "outline";
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [styles.button, outline ? styles.buttonOutline : styles.buttonPrimary, (disabled || loading) && { opacity: 0.6 }, pressed && { opacity: 0.85 }, style]}>
      {loading ? <ActivityIndicator color={outline ? colors.primary : colors.primaryForeground} />
        : <Text style={outline ? styles.buttonOutlineText : styles.buttonPrimaryText}>{title}</Text>}
    </Pressable>
  );
}

export function Badge({ children, tone = "default" }) {
  const t = { default: [colors.secondary, colors.secondaryForeground], success: ["#e3f3e4", colors.success], warning: ["#fbeed9", colors.warning] }[tone];
  return <View style={[styles.badge, { backgroundColor: t[0] }]}><Text style={{ color: t[1], fontSize: 12, fontWeight: "600" }}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing(4) },
  h1: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  muted: { fontSize: 13, color: colors.mutedForeground },
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: spacing(1) },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.input, borderRadius: radius.md, paddingHorizontal: spacing(3), paddingVertical: spacing(3), fontSize: 15, color: colors.foreground },
  button: { borderRadius: radius.md, paddingVertical: spacing(3.5), paddingHorizontal: spacing(4), alignItems: "center", justifyContent: "center" },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryText: { color: colors.primaryForeground, fontWeight: "600", fontSize: 15 },
  buttonOutline: { borderWidth: 1, borderColor: colors.border },
  buttonOutlineText: { color: colors.foreground, fontWeight: "600", fontSize: 15 },
  badge: { paddingHorizontal: spacing(2.5), paddingVertical: spacing(1), borderRadius: radius.pill, alignSelf: "flex-start" },
});

import { ScrollView, View, Text, Pressable } from "react-native";
import { CheckCircle2, Circle, Flame } from "lucide-react-native";
import { Screen, H1, Muted, Card, Badge } from "../../components/ui/UI";
import { colors, spacing } from "../../theme/colors";
import { useAppStore } from "../../store/AppStore";

export default function PlanoScreen({ navigation }) {
  const { session, getActivePlan, toggleMealConsumed } = useAppStore();
  const plan = getActivePlan(session.patientId);

  if (!plan) {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center", padding: spacing(6) }}>
        <Muted>Você ainda não tem um plano alimentar ativo.</Muted>
      </Screen>
    );
  }
  const done = plan.adherenceLog?.today ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(5), paddingTop: 64 }}>
        <H1>Seu plano de hoje</H1>
        <Muted style={{ marginTop: spacing(1) }}>{plan.name}</Muted>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(3), marginTop: spacing(4), marginBottom: spacing(5) }}>
          <Flame size={16} color={colors.terracotta} />
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>{plan.targetKcal} kcal/dia</Text>
          <Badge tone="success">{done.length}/{plan.meals.length} refeições</Badge>
        </View>
        {plan.meals.map((meal) => {
          const isDone = done.includes(meal.id);
          return (
            <Pressable key={meal.id} onPress={() => navigation.navigate("MealDetail", { mealId: meal.id, planId: plan.id })}>
              <Card style={{ marginBottom: spacing(3), flexDirection: "row", alignItems: "center" }}>
                <Pressable hitSlop={12} onPress={() => toggleMealConsumed(plan.id, meal.id)}>
                  {isDone ? <CheckCircle2 size={24} color={colors.success} /> : <Circle size={24} color={colors.border} />}
                </Pressable>
                <View style={{ marginLeft: spacing(3), flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: colors.foreground }}>{meal.name}</Text>
                  <Muted>{meal.time} · {meal.items.length} itens</Muted>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

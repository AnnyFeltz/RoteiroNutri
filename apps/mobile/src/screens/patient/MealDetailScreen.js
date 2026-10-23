import { ScrollView, View, Text } from "react-native";
import { Screen, H1, Muted, Card } from "../../components/ui/UI";
import { colors, spacing } from "../../theme/colors";
import { useAppStore } from "../../store/AppStore";

export default function MealDetailScreen({ route }) {
  const { mealId, planId } = route.params;
  const { plans } = useAppStore();
  const meal = plans.find((p) => p.id === planId)?.meals.find((m) => m.id === mealId);
  if (!meal) return <Screen style={{ padding: spacing(6) }}><Muted>Refeição não encontrada.</Muted></Screen>;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(5), paddingTop: 24 }}>
        <H1>{meal.name}</H1>
        <Muted style={{ marginTop: spacing(1), marginBottom: spacing(5) }}>Horário sugerido: {meal.time}</Muted>
        {meal.items.map((item, i) => (
          <Card key={i} style={{ marginBottom: spacing(2), flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.leaf, marginRight: spacing(3) }} />
            <Text style={{ color: colors.foreground, fontSize: 15 }}>{item}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UtensilsCrossed, TrendingUp, Trophy, User } from "lucide-react-native";
import { colors } from "../theme/colors";
import PlanoScreen from "../screens/patient/PlanoScreen";
import MealDetailScreen from "../screens/patient/MealDetailScreen";
import EvolucaoScreen from "../screens/patient/EvolucaoScreen";
import ConquistasScreen from "../screens/patient/ConquistasScreen";
import PerfilScreen from "../screens/patient/PerfilScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";

const Tab = createBottomTabNavigator();
const PlanoStack = createNativeStackNavigator();
const PerfilStack = createNativeStackNavigator();

function PlanoStackNavigator() {
  return (
    <PlanoStack.Navigator screenOptions={{ headerShown: false }}>
      <PlanoStack.Screen name="PlanoHome" component={PlanoScreen} />
      <PlanoStack.Screen name="MealDetail" component={MealDetailScreen} options={{ headerShown: true, title: "" }} />
    </PlanoStack.Navigator>
  );
}

const sub = (name, title) => (
  <PerfilStack.Screen key={name} name={name} component={PlaceholderScreen} initialParams={{ title }} options={{ headerShown: true, title }} />
);

function PerfilStackNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="PerfilHome" component={PerfilScreen} />
      {sub("PerfilEditar", "Editar dados")}
      {sub("PerfilHistorico", "Histórico de alterações")}
      {sub("PerfilNotificacoes", "Notificações")}
      {sub("PerfilPrivacidade", "Privacidade")}
    </PerfilStack.Navigator>
  );
}

export default function PatientNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.leaf, tabBarInactiveTintColor: colors.mutedForeground }}>
      <Tab.Screen name="Plano" component={PlanoStackNavigator} options={{ tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} /> }} />
      <Tab.Screen name="Evolucao" component={EvolucaoScreen} options={{ title: "Evolução", tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> }} />
      <Tab.Screen name="Conquistas" component={ConquistasScreen} options={{ tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
      <Tab.Screen name="Perfil" component={PerfilStackNavigator} options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Unbounded_700Bold, Unbounded_800ExtraBold, Unbounded_900Black,
} from "@expo-google-fonts/unbounded";
import {
  InstrumentSans_400Regular, InstrumentSans_500Medium,
  InstrumentSans_600SemiBold, InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import { I18nProvider, useI18n } from "./src/i18n";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AuthScreen from "./src/screens/AuthScreen";
import ClienteHome from "./src/screens/ClienteHome";
import TaxistaHome from "./src/screens/TaxistaHome";
import OfertasScreen from "./src/screens/OfertasScreen";
import ReservasScreen from "./src/screens/ReservasScreen";
import HistorialScreen from "./src/screens/HistorialScreen";
import ForoScreen from "./src/screens/ForoScreen";
import AjustesScreen from "./src/screens/AjustesScreen";
import AdminScreen from "./src/screens/AdminScreen";

const Tab = createBottomTabNavigator();

const icon = (e) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{e}</Text>
);

function Tabs() {
  const { user } = useAuth();
  const { t } = useI18n();
  const opts = {
    headerShown: false,
    animation: "shift",
    tabBarActiveTintColor: "#0B2E4F",
    tabBarInactiveTintColor: "#0B2E4F66",
    tabBarStyle: {
      backgroundColor: "#FFFFFF",
      borderTopColor: "#CFE0EE80",
      height: 60,
      paddingBottom: 8,
      paddingTop: 6,
      shadowColor: "#0B2E4F",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 10,
    },
    tabBarLabelStyle: { fontFamily: "InstrumentSans_700Bold", fontSize: 10 },
  };

  if (user.rol === "ADMIN") {
    return (
      <Tab.Navigator screenOptions={opts}>
        <Tab.Screen name="Admin" component={AdminScreen} options={{ title: t("adm.title"), tabBarIcon: icon("🛡️") }} />
        <Tab.Screen name="Ajustes" component={AjustesScreen} options={{ title: t("nav.settings"), tabBarIcon: icon("⚙️") }} />
      </Tab.Navigator>
    );
  }

  if (user.rol === "TAXISTA") {
    return (
      <Tab.Navigator screenOptions={opts}>
        <Tab.Screen name="Inicio" component={TaxistaHome} options={{ title: t("nav.drive"), tabBarIcon: icon("🚕") }} />
        <Tab.Screen name="Reservas" component={ReservasScreen} options={{ title: t("nav.reservations"), tabBarIcon: icon("📅") }} />
        <Tab.Screen name="Foro" component={ForoScreen} options={{ title: t("nav.forum"), tabBarIcon: icon("💬") }} />
        <Tab.Screen name="Historial" component={HistorialScreen} options={{ title: t("nav.trips"), tabBarIcon: icon("🧾") }} />
        <Tab.Screen name="Ajustes" component={AjustesScreen} options={{ title: t("nav.settings"), tabBarIcon: icon("⚙️") }} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={opts}>
      <Tab.Screen name="Inicio" component={ClienteHome} options={{ title: t("nav.ride"), tabBarIcon: icon("🚕") }} />
      <Tab.Screen name="Excursiones" component={OfertasScreen} options={{ title: t("nav.excursions"), tabBarIcon: icon("🌋") }} />
      <Tab.Screen name="Reservas" component={ReservasScreen} options={{ title: t("nav.reservations"), tabBarIcon: icon("📅") }} />
      <Tab.Screen name="Historial" component={HistorialScreen} options={{ title: t("nav.trips"), tabBarIcon: icon("🧾") }} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} options={{ title: t("nav.settings"), tabBarIcon: icon("⚙️") }} />
    </Tab.Navigator>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7FBFE" }}>
        <ActivityIndicator size="large" color="#E8AF00" />
      </View>
    );
  }

  return user ? <Tabs /> : <AuthScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Unbounded_700Bold, Unbounded_800ExtraBold, Unbounded_900Black,
    InstrumentSans_400Regular, InstrumentSans_500Medium,
    InstrumentSans_600SemiBold, InstrumentSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7FBFE" }}>
        <ActivityIndicator size="large" color="#E8AF00" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Router />
          </NavigationContainer>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

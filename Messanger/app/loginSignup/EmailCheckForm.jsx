import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  BackHandler,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import APIMethods from "../utils/APImethods";
import Signup from "./Signup"; // Import Signup screen
import LoginPassword from "./LoginPassword"; // Import LoginPassword screen
import JsonParser from "../utils/JsonParser";
import { usePathname, useRouter } from "expo-router";
import { ThemeContext } from "@/context/ThemeContext";
import { useContext } from "react";
import { LinearGradient } from "expo-linear-gradient";

const EmailCheckForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyle(theme, colorScheme);

  const router = useRouter();

  useEffect(() => {
    const backAction = () => {
      router.navigate("/");
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  const validateEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  };

  const handleSubmit = async () => {
    if (!email) {
      setError("Per favore inserisci la tua email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Non hai inserito un indirizzo email valido");
      return;
    }

    setError(null); // Clear previous errors

    checkEmailAndNavigate(email);
  };

  const checkEmailAndNavigate = async (emailValue) => {
    try {
      const emailResponse = await JsonParser.emailCheckJson(emailValue);

      if (emailResponse === "signup") {
        router.navigate({
          pathname: "/loginSignup/Signup",
          params: {
            emailValue: emailValue,
          },
        });
      } else if (emailResponse === "login") {
        router.navigate({
          pathname: "/loginSignup/LoginPassword",
          params: {
            emailValue: emailValue,
          },
        });
      } else {
        console.error("Errore: Risposta sconosciuta dall'API.");
      }
    } catch (error) {
      console.error("Errore durante la verifica email:", error);
    }
  };

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={["#1B2734", "#49698C", "#7896B7"]}
        locations={[0, 0.68, 1]} // 0% (0), 68% (0.68), 100% (1)
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.formContainer}>
            <Text
              style={{
                color: theme.text,
                fontSize: 56,
                marginBottom: 20,
                fontWeight: 700,
                top: -176,
              }}
            >
              EMAIL
            </Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={styles.containerStartButton}
              onPress={handleSubmit}
            >
              <Text style={styles.containerStartButtonText}>Invia</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

export default EmailCheckForm;

function createStyle(theme, colorScheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    formContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    input: {
      outlineStyle: "none",
      width: 250,
      borderBottomWidth: 1,
      borderBottomColor: "white",
      color: "white",
      marginBottom: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      pointerEvents: "auto",
    },
    inputError: {
      borderBottomColor: "red",
    },
    errorText: {
      color: "red",
      marginBottom: 8,
    },
    containerStartButton: {
      backgroundColor: theme.button,
      paddingHorizontal: 20,
      paddingVertical: 5,
      borderRadius: 100,
    },
    containerStartButtonText: {
      color: theme.text,
      fontSize: 18,
    },
  });
}

import React, { useState, useContext, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Image,
  BackHandler,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeContext } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';
import EvilIcons from '@expo/vector-icons/EvilIcons';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyle(theme, colorScheme);
  const router = useRouter();

  useEffect(() => {
    const checkLogged = async () => {
      const storeGetIsLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      if (storeGetIsLoggedIn === "true") {
        router.navigate("/messages");
      }
    };
    checkLogged().then(() => {
      console.log("CheckLogged completed");
    });

    const backAction = () => {
      Alert.alert("Hold on!", "Are you sure you want to go back?", [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.containerStart}>
            {/* <Image
              style={styles.containerStartImage}
              source={{
                uri: "https://picsum.photos/200",
              }}
            /> */}
            <Text
              style={{
                color: theme.text,
                fontSize: 56,
                marginBottom: 20,
                fontWeight: 700,
                top: -200,
              }}>
              BENVENUTO
            </Text>
            <Pressable
              style={styles.containerStartButton}
              onPress={() => router.navigate(`/loginSignup/EmailCheckForm`)}
            >
              {/* <Text style={styles.containerStartButtonText}>Start</Text> */}
              <EvilIcons name="arrow-right" size={56} color="white" />
            </Pressable>
          </View>
          <StatusBar
            style="light"
            backgroundColor={theme.backgroundClassic}
          />
        </SafeAreaView>
    </SafeAreaProvider>
  );
}

function createStyle(theme, colorScheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      paddingTop: 30,
      backgroundColor: theme.backgroundClassic,
    },
    containerStart: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    containerStartImage: {
      width: 200,
      height: 200,
      borderRadius: 100,
      marginBottom: 40,
    },
    containerStartButton: {
      // backgroundColor: theme.button,
      // paddingHorizontal: 20,
      // paddingVertical: 5,
      // borderRadius: 100,
    },
    containerStartButtonText: {
      color: theme.text,
      fontSize: 18,
    },
  });
}
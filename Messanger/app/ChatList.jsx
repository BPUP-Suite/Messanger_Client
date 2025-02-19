import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  Image,
  Animated,
  BackHandler,
  Alert,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ChatContent from "./ChatContent";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import localDatabase from "./utils/localDatabaseMethods";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import WebSocketMethods from "./utils/webSocketMethods";
import eventEmitter from "./utils/EventEmitter";
import NetInfo from "@react-native-community/netinfo";
import { FloatingAction } from "react-native-floating-action";
import AntDesign from '@expo/vector-icons/AntDesign';

const ChatList = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [chats, setChats] = useState([]);
  const [chatDetails, setChatDetails] = useState({});
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const router = useRouter();
  const [sidebarPosition] = useState(new Animated.Value(-250));
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(false);

  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyle(theme, colorScheme);

  const actions = [
    {
      text: "Nuova chat",
      icon: <AntDesign name="adduser" size={24} color="white" />,
      name: "bt_accessibility",
      position: 1,
      color: theme.floatingLittleButton,
    },
    {
      text: "Nuovo gruppo",
      icon: <AntDesign name="addusergroup" size={24} color="white" />,
      name: "bt_language",
      position: 2,
      color: theme.floatingLittleButton,
    },
    {
      text: "Location",
      // icon: require("./images/ic_room_white.png"),
      name: "bt_room",
      position: 3,
      color: theme.floatingLittleButton,
    },
    {
      text: "Video",
      // icon: require("./images/ic_videocam_white.png"),
      name: "bt_videocam",
      position: 4,
      color: theme.floatingLittleButton,
    },
  ];

  useEffect(() => {
    const checkLogged = async () => {
      const storeGetIsLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      if (storeGetIsLoggedIn == "true") {
        // Nota: valori da AsyncStorage sono stringhe
        const localUserId = await localDatabase.fetchLocalUserID();
        const apiKey = await localDatabase.fetchLocalUserApiKey();
        console.log("Chat list - DB:", localUserId);
        console.log("Chat list - DB:", apiKey);

        if (apiKey != null) {
          await WebSocketMethods.saveParameters(localUserId, apiKey);
          await WebSocketMethods.openWebSocketConnection();
        } else {
          console.log(
            "ChatList apikey checklogged (dovrebbe essere null), websocket non riaperta:",
            apiKey
          );
        }
      } else {
        logout();
      }
    };
    checkLogged().then(() => {
      console.log("CheckLogged completed");
    });

    const checkConnection = NetInfo.addEventListener((state) => {
      setNetworkAvailable(state.isConnected); // <--- AGGIUNTA: Aggiorna lo stato networkAvailable
      // if(networkAvailable){
      //   console.log("Sei di nuovo Online");
      // } else {
      //   console.log("Oh No! Sei Offline");
      // }
    });

    const backAction = () => {
      Alert.alert("Attenzione", "Sei sicuro di voler uscire?", [
        {
          text: "No",
          onPress: () => null,
          style: "cancel",
        },
        { text: "Si", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      backHandler.remove();
      checkConnection();
    };
  }, []);

  useEffect(() => {
    const handleNewLastMessage = eventEmitter.on(
      "updateNewLastMessage",
      (data) => {
        setChatDetails((currentChatDetails) => {
          if (data.chat_id in currentChatDetails) {
            return {
              ...currentChatDetails,
              [data.chat_id]: {
                ...currentChatDetails[data.chat_id],
                lastMessage: {
                  ...currentChatDetails[data.chat_id].lastMessage,
                  text: data.text || data.lastMessage.text,
                },
              },
            };
          }
          return currentChatDetails; // se il chat_id non esiste, non aggiorniamo nulla
        });
      }
    );
  }, []);

  useEffect(() => {
    console.log("useEffect Dimensions - Mounting/Running"); // Log di mount/run

    const updateScreenSize = () => {
      const { width } = Dimensions.get("window");
      setIsSmallScreen(width <= 768);
    };

    const listener = updateScreenSize;
    Dimensions.addEventListener("change", listener);
    updateScreenSize();
  }, []);

  const storeSetIsLoggedIn = async (value) => {
    try {
      await AsyncStorage.setItem("isLoggedIn", value);
      console.log("storeSetIsLoggedIn: ", value);
    } catch (e) {
      console.log(e);
    }
  };

  const logout = async () => {
    router.push("/loginSignup/EmailCheckForm");
  };

  // Mock database functions
  const fetchLocalUserNameAndSurname = () => Promise.resolve("John Doe");

  const fetchChats = () =>
    localDatabase.fetchChats().then((chats) => {
      return chats.map((chat) => ({
        chat_id: chat.chat_id,
        group_channel_name: chat.group_channel_name || "",
      }));
    });

  const fetchUser = async (chatId) =>
    Promise.resolve({ handle: await localDatabase.fetchUser(chatId) });

  const fetchLastMessage = async (chatId) => {
    const row = await localDatabase.fetchLastMessage(chatId);
    // console.log(row);
    const msgText = row.text;
    const msgTime = row.date_time;
    // console.log(msgText);
    // console.log(msgTime);

    return Promise.resolve({
      text: msgText,
      date_time: msgTime,
    });
  };

  useEffect(() => {
    fetchLocalUserNameAndSurname().then(setUserName);
    fetchChats().then(async (chats) => {
      const details = {};
      for (const chat of chats) {
        const user = await fetchUser(chat.chat_id);
        const lastMessage = await fetchLastMessage(chat.chat_id);
        details[chat.chat_id] = { user, lastMessage };
      }
      setChats(chats);

      setChatDetails(details);
    });
  }, []);

  const toggleSidebar = () => {
    Animated.timing(sidebarPosition, {
      toValue: isSidebarVisible ? -250 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsSidebarVisible(!isSidebarVisible);
      setOverlayVisible(!isSidebarVisible); // Invertiamo anche l'overlay
    });
  };

  const renderOverlay = () =>
    overlayVisible && (
      <Pressable
        style={styles.overlay}
        onPress={() => {
          toggleSidebar();
        }}
      />
    );

  const renderSidebar = () => (
    <>
      {renderOverlay()}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarPosition }],
          },
          { paddingTop: Platform.OS === "android" ? 25 : 10 },
        ]}
      >
        <Pressable onPress={toggleSidebar} style={styles.closeButton}>
          <Icon name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.sidebarText}>Menu Item 1</Text>
        <Text style={styles.sidebarText}>Menu Item 2</Text>
        <Pressable
          onPress={() => {
            localDatabase.clearDatabase(),
              storeSetIsLoggedIn("false"),
              logout();
          }}
        >
          <Text style={styles.sidebarText}>Logout</Text>
        </Pressable>
      </Animated.View>
    </>
  );

  const renderHeader = () => {
    const selectedDetails = chatDetails[selectedChat] || {};
    const user = selectedDetails.user || {};

    return (
      <View style={styles.header}>
        {isSmallScreen && selectedChat ? (
          <Pressable
            onPress={() => setSelectedChat(null)}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={theme.icon} />
          </Pressable>
        ) : (
          <Pressable onPress={toggleSidebar} style={styles.menuButton}>
            <Icon name="menu" size={24} color={theme.icon} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>
          {isSmallScreen && selectedChat ? user.handle : ""}
        </Text>
      </View>
    );
  };

  const renderChatList = () => (
    <View
      style={[
        styles.chatList,
        !isSmallScreen && styles.largeScreenChatList,
        !isSmallScreen
          ? { borderRightColor: theme.chatListRightBorder, borderRightWidth: 1 }
          : null,
      ]}
    >
      <FlatList
        data={chats}
        keyExtractor={(item) => item.chat_id}
        renderItem={({ item }) => {
          const details = chatDetails[item.chat_id] || {};
          const user = details.user || {};
          const lastMessage = details.lastMessage || {};

          return (
            <Pressable
              style={[
                styles.chatItem,
                selectedChat === item.chat_id && styles.selected,
              ]}
              onPress={() => setSelectedChat(item.chat_id)}
            >
              <Image
                source={{ uri: "https://picsum.photos/200" }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.chatTitle}>
                  {item.group_channel_name || user.handle || "Unknown User"}
                </Text>
                <Text style={styles.chatSubtitle}>
                  {/* {lastMessage.sender || "No User:"} */}
                  {lastMessage.text || "No messages yet"}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <FloatingAction
        actions={actions}
        onPressItem={(name) => {
          console.log(`selected button: ${name}`);
        }}
        color={theme.floatingBigButton}
        overlayColor='rgba(0, 0, 0, 0)'
        shadow={{
          shadowColor: "transparent",
        }}
      />
    </View>
  );

  const renderChatContent = () => {
    const selectedDetails = chatDetails[selectedChat] || {};
    const user = selectedDetails.user || {};
    const lastMessage = selectedDetails.lastMessage || {};

    return (
      <View style={styles.chatContent}>
        {selectedChat && (
          <>
            {/* The back arrow and title should be part of ChatContent or directly here, not nested */}
            {isSmallScreen && selectedChat ? null : (
              <View
                style={[
                  styles.header,
                  isSmallScreen ? styles.mobileHeader : null,
                ]}
              >
                {/* <Pressable onPress={() => setSelectedChat(null)} style={styles.backButton}>
                <Icon name="arrow-back" size={24} color="#fff" />
              </Pressable> */}
                <Text style={styles.headerTitle}>Chat with {user.handle}</Text>
              </View>
            )}

            <ChatContent
              chatId={selectedChat}
              userId={userId}
              lastMessage={lastMessage.text}
              dateTime={lastMessage.date_time}
              onBack={() => setSelectedChat(null)}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { paddingTop: Platform.OS === "android" ? 25 : 0 },
      ]}
    >
      {renderSidebar()}
      {renderHeader()}
      <View style={styles.container}>
        {isSmallScreen && !selectedChat ? (
          renderChatList()
        ) : isSmallScreen && selectedChat ? (
          renderChatContent()
        ) : (
          <>
            {renderChatList()}
            {renderChatContent()}
          </>
        )}
      </View>
      {!networkAvailable ? (
        <Text style={styles.connectionInfoContainer}>
          Network Status: Not Connected
        </Text>
      ) : null}
    </SafeAreaView>
  );
};

export default ChatList;

function createStyle(theme, colorScheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#17212b",
      paddingTop: 30,
    },
    container: {
      flex: 1,
      flexDirection: "row",
    },
    header: {
      backgroundColor: "#17212b",
      flexDirection: "row",
      padding: 10,
    },
    menuButton: {
      marginRight: 10,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
    },
    chatList: {
      backgroundColor: "#17212b",
      flex: 1,
    },
    largeScreenChatList: {
      flex: 0.4,
    },
    chatItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.chatListDivider,
    },
    selected: {
      backgroundColor: theme.chatListSelected,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    chatTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
    },
    chatSubtitle: {
      fontSize: 14,
      color: theme.text,
    },
    chatContent: {
      flex: 1,
      padding: 10,
      backgroundColor: theme.backgroundChat,
    },
    sidebar: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 250,
      backgroundColor: "#333",
      zIndex: 2,
      padding: 10,
    },
    sidebarVisible: {
      transform: [{ translateX: 0 }],
    },
    sidebarHidden: {
      transform: [{ translateX: -250 }],
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1, // Assicurati che sia sopra il contenuto ma sotto la sidebar
    },
    sidebarText: {
      color: theme.text,
      marginVertical: 10,
    },
    backButton: {
      marginTop: 10,
      padding: 10,
      backgroundColor: "#007AFF",
      borderRadius: 5,
      alignSelf: "flex-start",
    },
    backButtonText: {
      color: theme.icon,
      fontWeight: "bold",
    },
    mobileHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
    },
    backButton: {
      marginRight: 10,
    },
    connectionInfoContainer: {
      backgroundColor: theme.backgroundChatListCheckNetwork,
      padding: 10,
      margin: 10,
      borderRadius: 8,
      borderColor: "black",
      color: "white",
    },
  });
}

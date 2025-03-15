import localDatabase from "../utils/localDatabaseMethods";
import eventEmitter from "./EventEmitter";
import { io } from "socket.io-client";

let socket = null;
let localUserID = "";
let apiKey = "";
// const socketAddress = "wss://ws.messanger.bpup.israiken.it/";

let sendMessageAttempt = 0;

const WebSocketMethods = {
  saveParameters: async (localUserIDParam, apiKeyParam) => {
    localUserID = localUserIDParam;
    apiKey = apiKeyParam;
    console.log("Parametri salvati");
  },

  isWebSocketOpen: () => {
    return socket && socket.connected;
  },

  openWebSocketConnection: async () => {
    // const url = `${socketAddress}?userId=${localUserID}&apiKey=${apiKey}`;

    try {
      if (socket && socket.connected) {
        console.log("Una connessione Socket.IO era già aperta");
        return;
      } else if (socket) {
        socket.disconnect();
        socket = null;
      }

      socket = io("wss://ws.messanger.bpup.israiken.it/", {
        transports: ["websocket"],
        autoConnect: true,
        reconnectionAttempts: -1,
        auth: {
          user_id: localUserID,
          api_key: apiKey,
        },
      });

      socket.on("connect", async () => {
        console.log("Connessione Socket.IO aperta");
        await WebSocketMethods.socketReceiver();
        eventEmitter.emit("webSocketOpen");
      });

      socket.on("connect_error", (error) => {
        console.log("Socket.IO connection error:", error);
      });

      socket.on("disconnect", () => {
        console.log("Connessione Socket.IO chiusa");
      });
    } catch (error) {
      console.error("Socket.IO initialization error:", error);
    }
  },

  //richiedo l'init
  init: async () => {
    try {
      socket.emit("init");
      console.log("Init inviato alla socket.io");
    } catch (error) {
      console.log(error);
    }
  },

  sendNewMessage: async (data) => {
    try {
      socket.emit("send_message", data)
    } catch (error) {
      console.log(error);
    }
  },

  

  // webSocketSenderMessage: async (message) => {
  //   if (WebSocketMethods.isWebSocketOpen()) {
  //     try {
  //       socket.emit("message", message);
  //       console.log(
  //         `Messaggio inviato tramite Socket.IO: ${JSON.stringify(message)}`
  //       );
  //     } catch (error) {
  //       console.error("Error sending message:", error);
  //     }
  //   } else {
  //     if (sendMessageAttempt < 5) {
  //       setTimeout(async () => {
  //         console.log("Socket.IO non aperta per l'invio, ritento...");
  //         await WebSocketMethods.openWebSocketConnection();
  //         await WebSocketMethods.webSocketSenderMessage(message);
  //         sendMessageAttempt += 1;
  //       }, 2000);
  //     } else {
  //       console.error(
  //         "Socket.IO non aperta per l'invio, massimo tentativi raggiunti."
  //       );
  //     }
  //   }
  // },

  socketReceiver: async () => {
    if (!socket) {
      console.log("Socket.IO non inizializzata (socketReceiver)");
      return;
    }

    socket.on("init", async (data) => {
      if (data.init) {
        console.log("Init Successo Socket.IO:", data);
        const { email, handle, name, surname } = data.localUser;
        await localDatabase.updateLocalUser(email, handle, name, surname);
        const localUserHandle = await localDatabase.fetchLocalUserHandle();
        console.log("Database updateLocalUser completed");

        if (data.chats == null) {
          eventEmitter.emit("loginToChatList");
          console.log("Chat nell'init vuote, init completato con successo");
          return;
        }

        for (const chat of data.chats) {
          const chatName = chat.name || "";
          await localDatabase.insertChat(chat.chat_id, chatName);
          console.log(
            `Database insertChat for chat_id ${chat.chat_id} completed`
          );

          for (const user of chat.users) {
            if(user.handle != localUserHandle) {
              localDatabase.insertChatAndUsers(chat.chat_id, user.handle);
              localDatabase.insertUsers(user.handle);
            }
            
            console.log(
              `Database insertUsers and insertChatAndUsers for user ${user.handle} in chat ${chat.chat_id} completed`
            );
          }



          for (const message of chat.messages) {
            await localDatabase.insertMessage(
              message.message_id,
              chat.chat_id,
              message.text,
              message.sender.toString(),
              message.date,
              ""
            );
            // console.log("inserimento messaggio: ", message);
          }
        }

        eventEmitter.emit("loginToChatList");
        console.log("Socket.IO Init completato con successo");
      } else {
        console.log("Server error during Socket.IO init");
      }
    });

    socket.on("send_message", async (data) => {
      if (data.send_message) {
        console.log("Messaggio tornato indietro (send_message: true):", data);
        localDatabase.updateSendMessage(data.date, data.message_id, data.hash);
        console.log(
          `Database updateSendMessage for message_id ${data.message_id} completed`
        );

        lastMessageData = {
          chat_id: data.chat_id,
          text: null,
          date: data.date
        }
        
        eventEmitter.emit("updateNewLastMessage", lastMessageData);
        console.log("💎💎💎🟡", lastMessageData);
      } else {
        console.log("Messaggio tornato indietro (send_message: false):", data);
      }
    });

    socket.on("receive_message", async (data) => {
      const { message_id, chat_id, text, sender, date } = data;
      await localDatabase.insertMessage(
        message_id,
        chat_id,
        text,
        sender,
        date,
        ""
      );
      console.log(
        `Database insertMessage for message_id ${message_id} in chat ${chat_id} completed`
      );
      eventEmitter.emit("newMessage", data);
      eventEmitter.emit("updateNewLastMessage", data);
      console.log(`Nuovo messaggio ricevuto da ${sender}`);
    });

    return "return of socket.io receiver function";
  },
};

export default WebSocketMethods;

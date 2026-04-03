import { HubConnectionBuilder } from "@microsoft/signalr";

export const createSignalRConnection = () => {
  return new HubConnectionBuilder()
    .withUrl("http://localhost:5056/encryptedChatHub", {
      accessTokenFactory: () => localStorage.getItem('token')
    })
    .withAutomaticReconnect()
    .build();
};
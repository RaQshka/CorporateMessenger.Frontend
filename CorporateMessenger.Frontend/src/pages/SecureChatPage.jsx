import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Button, Heading, VStack, Modal, 
  ModalOverlay, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, Text, useToast 
} from '@chakra-ui/react';
import { HubConnectionBuilder } from "@microsoft/signalr";
import CreateSecureChatModal from '../features/secureChat/CreateSecureChatModal';
import EnterSecureChatModal from '../features/secureChat/EnterSecureChatModal';
import ChatActivity from '../features/secureChat/ChatActivity';
import { createSecureChat, destroySecureChat } from '../services/api';
import { EncryptionService } from '../features/secureChat/EncryptionService';
import Header from '../components/Header';
import Footer from '../components/Footer';

function SecureChatPage({ userId }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [accessKey, setAccessKey] = useState(null);
  const [isAccessKeyModalOpen, setIsAccessKeyModalOpen] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [connection, setConnection] = useState(null);
  const toast = useToast();

  // Инициализация соединения SignalR
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5056/encryptedChatHub", {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        
        // Подписка на события
        newConnection.on("ReceiveEncryptedMessage", (message) => {
          console.log("New encrypted message:", message);
        });
        
        newConnection.on("PublicKeyUpdated", (updatedUserId, newPublicKey) => {
          console.log("Public key updated:", updatedUserId, newPublicKey);
          if (updatedUserId !== userId && chatInfo) {
            EncryptionService.deriveSharedSecret(
              chatInfo.privateKey,
              newPublicKey
            ).then(newAesKey => {
              setChatInfo(prev => ({
                ...prev,
                otherPublicKey: newPublicKey,
                aesKey: newAesKey
              }));
            });
          }
        });
      })
      .catch(err => console.error('SignalR Connection Error:', err));

    return () => {
      newConnection.stop().catch(err => console.error('SignalR Stop Error:', err));
    };
  }, [userId, chatInfo]);

  // Присоединение к группе чата при изменении chatInfo
  useEffect(() => {
    if (connection && connection.state === 'Connected' && chatInfo?.chatId) {
      connection.invoke("JoinChat", chatInfo.chatId)
        .catch(err => console.error('Join chat error:', err));
    }
  }, [connection, chatInfo?.chatId]);

  const handleChatCreated = (newChatInfo) => {
    setChatInfo(newChatInfo);
    setAccessKey(newChatInfo.accessKey);
    setIsAccessKeyModalOpen(true);
  };

  const handleChatEntered = (enteredChatInfo) => {
    setChatInfo(enteredChatInfo);
    setAccessKey(enteredChatInfo.accessKey);
  };

  const handleUpdateKey = async () => {
    try {
      const newKeyPair = await EncryptionService.generateKeyPair();
      const newPublicKey = await EncryptionService.exportPublicKey(newKeyPair.publicKey);
      
      await api.post('/secure-chat/UpdatePublicKey', {
        secureChatId: chatInfo.chatId,
        publicKey: newPublicKey,
      });
      
      const newAesKey = await EncryptionService.deriveSharedSecret(
        newKeyPair.privateKey, 
        chatInfo.otherPublicKey
      );
      
      setChatInfo(prev => ({
        ...prev,
        privateKey: newKeyPair.privateKey,
        aesKey: newAesKey,
      }));
      
      if (connection) {
        await connection.invoke("UpdatePublicKey", chatInfo.chatId, userId, newPublicKey);
      }
    } catch (error) {
      console.error("Key update error:", error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить ключ',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDestroyChat = async () => {
    try {
      await destroySecureChat(chatInfo.chatId);
      setChatInfo(null);
      setAccessKey(null);
      setIsAccessKeyModalOpen(false);
    } catch (error) {
      console.error("Chat destroy error:", error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить чат',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const closeAccessKeyModal = () => {
    setIsAccessKeyModalOpen(false);
  };

  return (
    <Box p={4}>
      <Header />
      <VStack spacing={4}>
        <Heading>Безопасный чат</Heading>
        <Button onClick={() => setIsCreateModalOpen(true)}>Создать чат</Button>
        <Button onClick={() => setIsEnterModalOpen(true)}>Войти в чат</Button>
        
        {chatInfo && (
          <>
            <Button onClick={handleUpdateKey}>Обновить ключ</Button>
            {chatInfo.isCreator && (
              <Button onClick={handleDestroyChat}>Уничтожить чат</Button>
            )}
            <ChatActivity 
              chatId={chatInfo.chatId} 
              aesKey={chatInfo.aesKey} 
              userId={userId}
              connection={connection}
            />
          </>
        )}
      </VStack>
      
      <CreateSecureChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChatCreated={handleChatCreated}
        userId={userId}
      />
      
      <EnterSecureChatModal
        isOpen={isEnterModalOpen}
        onClose={() => setIsEnterModalOpen(false)}
        onChatEntered={handleChatEntered}
        userId={userId}
      />
      
      <Modal isOpen={isAccessKeyModalOpen} onClose={closeAccessKeyModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Код доступа к чату</ModalHeader>
          <ModalBody>
            <Text>Сохраните этот код для доступа к чату:</Text>
            <Text fontWeight="bold" mt={2}>{accessKey}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={closeAccessKeyModal}>
              Закрыть
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <Footer/>
    </Box>
  );
}

export default SecureChatPage;
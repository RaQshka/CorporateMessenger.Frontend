import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';
import {
  getSecureChatActivity,
  sendEncryptedMessage,
  uploadEncryptedDocument,
  destroySecureChat,
} from '../services/api';
import { encryptData, encryptFile, computeSharedSecret, deriveAESKey } from '../features/secureChat/EncryptionService';
import CreateSecureChatModal from '../features/secureChat/CreateSecureChatModal';
import EnterSecureChatModal from '../features/secureChat/EnterSecureChatModal';
import MessageComponent from '../features/secureChat/MessageComponent';
import * as signalR from '@microsoft/signalr';

function SecureChatPage({ userId }) {
  const [chatInfo, setChatInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const connectionRef = useRef(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5056/secureChatHub', {
        accessTokenFactory: () => localStorage.getItem('token'),
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => console.log('Connected to SignalR'))
      .catch(err => console.error('Error connecting to SignalR:', err));

    connection.on('OnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    connection.on('UserJoined', (userId) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    connection.on('UserLeft', (userId) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    connection.on('ReceiveEncryptedMessage', (chatId, senderId, ciphertext, iv, tag) => {
      if (chatId === chatInfo?.chatId.toString()) {
        const newActivity = {
          id: Math.random().toString(),
          type: 'Message',
          data: { ciphertext, iv, tag, sender: { id: senderId } },
          timestamp: new Date().toISOString(),
        };
        setActivities(prev => [...prev, newActivity]);
      }
    });

    connection.on('ReceiveEncryptedDocument', (chatId, documentId) => {
      if (chatId === chatInfo?.chatId.toString()) {
        toast({
          title: 'Новый документ',
          description: `Загружен документ с ID ${documentId}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        fetchActivity();
      }
    });

    connection.on('PublicKeyUpdated', async (updatedUserId, newPublicKey) => {
      if (updatedUserId !== userId.toString() && chatInfo) {
        const sharedSecret = await computeSharedSecret(chatInfo.privateKey, newPublicKey);
        const aesKey = await deriveAESKey(sharedSecret);
        setChatInfo(prev => ({ ...prev, otherPublicKey: newPublicKey, aesKey }));
        toast({
          title: 'Ключ обновлен',
          description: `Пользователь ${updatedUserId} обновил свой ключ.`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    });

    return () => connection.stop();
  }, [chatInfo, toast, userId]);

  useEffect(() => {
    if (chatInfo?.chatId) {
      fetchActivity();
      const interval = setInterval(fetchActivity, 5000);
      return () => clearInterval(interval);
    }
  }, [chatInfo]);

  const fetchActivity = async () => {
    try {
      const data = await getSecureChatActivity(chatInfo.chatId);
      setActivities(data);
      await connectionRef.current.invoke('JoinChat', chatInfo.chatId.toString());
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить активность чата.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatInfo || !connectionRef.current) return;
    setIsLoading(true);
    try {
      const encrypted = await encryptData(message, chatInfo.aesKey);
      await connectionRef.current.invoke(
        'SendEncryptedMessage',
        chatInfo.chatId.toString(),
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.tag
      );
      setMessage('');
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async () => {
    if (!file || !chatInfo || !connectionRef.current) return;
    setIsLoading(true);
    try {
      const encrypted = await encryptFile(file, chatInfo.aesKey);
      await uploadEncryptedDocument({
        secureChatId: chatInfo.chatId,
        fileData: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
        fileName: file.name,
        fileType: file.type,
      });
      await connectionRef.current.invoke('EncryptedDocumentUploaded', chatInfo.chatId.toString(), Math.random().toString());
      setFile(null);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файл.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestroyChat = async () => {
    if (!chatInfo?.chatId) return;
    setIsLoading(true);
    try {
      await destroySecureChat(chatInfo.chatId);
      setChatInfo(null);
      setActivities([]);
      toast({
        title: 'Успех',
        description: 'Чат уничтожен.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось уничтожить чат.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKey = async () => {
    if (!chatInfo || !connectionRef.current) return;
    setIsLoading(true);
    try {
      const { publicKey, privateKey, cryptoKeyPair } = await generateKeyPair();
      await api.post('/secure-chat/UpdatePublicKey', {
        secureChatId: chatInfo.chatId,
        publicKey,
      });
      const sharedSecret = await computeSharedSecret(privateKey, chatInfo.otherPublicKey);
      const aesKey = await deriveAESKey(sharedSecret);
      setChatInfo(prev => ({ ...prev, privateKey, aesKey, cryptoKeyPair }));
      await connectionRef.current.invoke('UpdatePublicKey', chatInfo.chatId.toString(), userId.toString(), publicKey);
      toast({
        title: 'Успех',
        description: 'Ваш ключ успешно обновлен.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить ключ.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatCreated = (info) => {
    setChatInfo({ ...info, chatId: null, otherPublicKey: null, aesKey: null });
  };

  const handleChatEntered = (info) => {
    setChatInfo(info);
  };

  return (
    <Box minH="100vh" p={4}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Защищенный чат</Heading>
          <HStack>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Создать чат
            </Button>
            <Button onClick={() => setIsEnterModalOpen(true)}>
              Войти в чат
            </Button>
            {chatInfo && (
              <>
                <Button
                  colorScheme="red"
                  onClick={handleDestroyChat}
                  isLoading={isLoading}
                >
                  Уничтожить чат
                </Button>
                <Button
                  onClick={handleUpdateKey}
                  isLoading={isLoading}
                >
                  Обновить ключ
                </Button>
              </>
            )}
          </HStack>
        </HStack>
        {chatInfo && (
          <Text>Онлайн: {onlineUsers.join(', ') || 'Никто'}</Text>
        )}
        {chatInfo ? (
          <>
            <Text>Чат: {chatInfo.chatName || 'Без названия'}</Text>
            <Box
              p={4}
              borderWidth={1}
              borderRadius="md"
              maxH="70vh"
              overflowY="auto"
              sx={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '.300', borderRadius: '4px' },
              }}
            >
              <VStack align="stretch" spacing={2}>
                {activities.map((activity) => (
                  <MessageComponent
                    key={activity.id}
                    activity={activity}
                    aesKey={chatInfo.aesKey}
                    userId={userId}
                  />
                ))}
              </VStack>
            </Box>
            <HStack>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите сообщение"
              />
              <Button
                colorScheme="blue"
                onClick={handleSendMessage}
                isLoading={isLoading}
              >
                Отправить
              </Button>
            </HStack>
            <HStack>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <Button
                colorScheme="blue"
                onClick={handleUploadFile}
                isLoading={isLoading}
              >
                Загрузить
              </Button>
            </HStack>
          </>
        ) : (
          <Text>Создайте или войдите в защищенный чат.</Text>
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
    </Box>
  );
}

export default SecureChatPage;
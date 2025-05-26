import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  useToast,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { HubConnectionBuilder } from '@microsoft/signalr';
import {
  getUserChats,
  createChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getDocuments,
  uploadDocument,
  getUsers,
  addUserToChat,
  grantChatAccess,
  revokeChatAccess,
  grantDocumentAccess,
  revokeDocumentAccess,
  getRoles,
} from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CHAT_TYPES = [
  { value: 0, label: 'Групповой чат' }, // ChatTypes.Group
  { value: 1, label: 'Приватный чат' }, // ChatTypes.Private
];

const ACCESS_FLAGS = [
  { value: 1, label: 'Чтение' }, // Предполагаемые значения ChatAccess/DocumentAccessFlag
  { value: 2, label: 'Запись' },
];

function Dashboard() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatName, setChatName] = useState('');
  const [chatType, setChatType] = useState(CHAT_TYPES[0].value);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [accessRules, setAccessRules] = useState({ roleId: '', access: 1 });
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessTarget, setAccessTarget] = useState(null);
  const [file, setFile] = useState(null);
  const [connection, setConnection] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesRef = useRef(null);
  const userId = localStorage.getItem('userId'); // Предполагается, что UserId сохранен
  const toast = useToast();

  // Загрузка чатов
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        const data = await getUserChats();
        if (Array.isArray(data)) {
          setChats(data);
        } else {
          throw new Error('Неверный формат данных чатов');
        }
      } catch (err) {
        setError('Не удалось загрузить чаты');
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список чатов.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchChats();
  }, [toast]);

  // Загрузка пользователей и ролей
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(rolesData)) setRoles(rolesData);
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchData();
  }, [toast]);

  // Загрузка сообщений и документов
  const fetchMessages = async (chatId, skipValue, append = false) => {
    try {
      const data = await getMessages(chatId, skipValue, 20);
      if (Array.isArray(data)) {
        const enrichedMessages = data.map((msg) => {
          const sender = users.find((u) => u.userId === msg.senderId);
          return {
            ...msg,
            senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Неизвестно',
          };
        });
        setMessages((prev) => (append ? [...enrichedMessages, ...prev] : enrichedMessages));
        setHasMore(data.length === 20);
      } else {
        throw new Error('Неверный формат сообщений');
      }
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchDocuments = async (chatId) => {
    try {
      const data = await getDocuments(chatId);
      if (Array.isArray(data)) {
        setDocuments(
          data.map((doc) => ({
            ...doc,
            downloadUrl: `/api/documents/${doc.id}/download`,
          })),
        );
      } else {
        throw new Error('Неверный формат документов');
      }
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить документы.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (selectedChat) {
      setIsLoadingContent(true);
      setSkip(0);
      Promise.all([
        fetchMessages(selectedChat.id, 0),
        fetchDocuments(selectedChat.id),
      ]).finally(() => setIsLoadingContent(false));
    }
  }, [selectedChat, users]);

  // Автозагрузка сообщений при прокрутке
  const handleScroll = () => {
    if (messagesRef.current.scrollTop === 0 && hasMore && !isLoadingContent) {
      setIsLoadingContent(true);
      const newSkip = skip + 20;
      fetchMessages(selectedChat.id, newSkip, true).then(() => {
        setSkip(newSkip);
        setIsLoadingContent(false);
      });
    }
  };

  // Настройка SignalR
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5056/chatHub')
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection && selectedChat) {
      connection
        .start()
        .then(() => {
          connection.on('ReceiveMessage', () => fetchMessages(selectedChat.id, skip));
          connection.on('ReceiveDocument', () => fetchDocuments(selectedChat.id));
          connection.on('ReceiveEditedMessage', () => fetchMessages(selectedChat.id, skip));
          connection.on('ReceiveDeletedMessage', () => fetchMessages(selectedChat.id, skip));
        })
        .catch((err) => console.error('Ошибка SignalR:', err));
      return () => {
        connection.stop();
      };
    }
  }, [connection, selectedChat, skip]);

  // Создание чата
  const handleCreateChat = async () => {
    if (!chatName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название чата не может быть пустым',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (chatType === 1 && selectedUsers.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы одного пользователя для приватного чата',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await createChat({ name: chatName, type: chatType });
      if (response.chatId) {
        for (const userId of selectedUsers) {
          await addUserToChat(response.chatId, { userId });
        }
        if (accessRules.roleId) {
          await grantChatAccess(response.chatId, {
            roleId: accessRules.roleId,
            access: accessRules.access,
          });
        }
        const data = await getUserChats();
        setChats(data);
        setIsModalOpen(false);
        setChatName('');
        setChatType(CHAT_TYPES[0].value);
        setSelectedUsers([]);
        setAccessRules({ roleId: '', access: 1 });
        toast({
          title: 'Успех',
          description: 'Чат успешно создан',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Сообщение не может быть пустым',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSending(true);
    try {
      await sendMessage({ chatId: selectedChat.id, content: message });
      setMessage('');
      fetchMessages(selectedChat.id, skip);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Редактирование сообщения
  const handleEditMessage = async () => {
    if (!editContent.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Сообщение не может быть пустым',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      await editMessage(editMessageId, { newContent: editContent });
      setIsEditing(false);
      setEditMessageId(null);
      setEditContent('');
      fetchMessages(selectedChat.id, skip);
      toast({
        title: 'Успех',
        description: 'Сообщение отредактировано',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отредактировать сообщение.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Удаление сообщения
  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      fetchMessages(selectedChat.id, skip);
      toast({
        title: 'Успех',
        description: 'Сообщение удалено',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сообщение.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Загрузка документа
  const handleUploadDocument = async () => {
    if (!file) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файл',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const response = await uploadDocument({ file, chatId: selectedChat.id });
      if (accessRules.roleId) {
        await grantDocumentAccess(response.documentId, {
          roleId: accessRules.roleId,
          accessFlag: accessRules.access,
        });
      }
      fetchDocuments(selectedChat.id);
      setFile(null);
      toast({
        title: 'Успех',
        description: 'Документ загружен',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить документ.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Настройка правил доступа
  const handleSetAccess = async () => {
    if (!accessRules.roleId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите роль',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      if (accessTarget.type === 'chat') {
        const data = { roleId: accessRules.roleId, access: accessRules.access };
        if (accessRules.accessType === 'grant') {
          await grantChatAccess(accessTarget.id, data);
        } else {
          await revokeChatAccess(accessTarget.id, data);
        }
      } else {
        const data = { roleId: accessRules.roleId, accessFlag: accessRules.access };
        if (accessRules.accessType === 'grant') {
          await grantDocumentAccess(accessTarget.id, data);
        } else {
          await revokeDocumentAccess(accessTarget.id, data);
        }
      }
      toast({
        title: 'Успех',
        description: 'Правила доступа обновлены',
        status: 'success',
        duration: 3003,
        isClosable: true,
      });
      setIsAccessModalOpen(false);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить правила доступа.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Flex flex="1" p={4}>
        {/* Левая панель: список чатов */}
        <Box w="30%" borderRightWidth={1} pr={4}>
          <Heading as="h3" size="md" mb={4}>Чаты</Heading>
          <Button colorScheme="blue" mb={4} onClick={() => setIsModalOpen(true)}>
            Создать чат
          </Button>
          {isLoadingChats ? (
            <Text>Загрузка...</Text>
          ) : error ? (
            <Text color="red.500">{error}</Text>
          ) : chats.length === 0 ? (
            <Text>Нет чатов</Text>
          ) : (
            <VStack spacing={2} align="stretch">
              {chats.map((chat) => (
                <Box
                  key={chat.id}
                  p={2}
                  borderWidth={1}
                  borderRadius="md"
                  cursor="pointer"
                  bg={selectedChat?.id === chat.id ? 'blue.100' : 'white'}
                  onClick={() => setSelectedChat(chat)}
                >
                  <Text fontWeight="bold">{chat.name}</Text>
                  <Text fontSize="sm">
                    Тип: {CHAT_TYPES.find((t) => t.value === parseInt(chat.type))?.label || chat.type}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {/* Правая панель: контент чата */}
        <Box w="70%" pl={4}>
          {selectedChat ? (
            <>
              <Heading as="h3" size="md" mb={4}>{selectedChat.name}</Heading>
              <Button
                size="sm"
                mb={2}
                onClick={() => {
                  setAccessTarget({ type: 'chat', id: selectedChat.id });
                  setIsAccessModalOpen(true);
                }}
              >
                Настроить доступ к чату
              </Button>
              {isLoadingContent ? (
                <Text>Загрузка...</Text>
              ) : (
                <>
                  <Box
                    ref={messagesRef}
                    maxH="60vh"
                    overflowY="auto"
                    p={2}
                    borderWidth={1}
                    borderRadius="md"
                    onScroll={handleScroll}
                  >
                    {messages.map((msg) => (
                      <Box key={msg.id} p={2} borderWidth={1} borderRadius="md" mb={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{msg.senderName}</Text>
                          {msg.senderId === userId && !msg.isDeleted && (
                            <HStack>
                              <IconButton
                                size="sm"
                                icon={<EditIcon />}
                                onClick={() => {
                                  setIsEditing(true);
                                  setEditMessageId(msg.id);
                                  setEditContent(msg.content);
                                }}
                              />
                              <IconButton
                                size="sm"
                                icon={<DeleteIcon />}
                                onClick={() => handleDeleteMessage(msg.id)}
                              />
                            </HStack>
                          )}
                        </HStack>
                        <Text>{msg.isDeleted ? '[Удалено]' : msg.content}</Text>
                        {msg.replyToMessageId && (
                          <Text fontSize="sm" color="gray.500">
                            В ответ на: {messages.find((m) => m.id === msg.replyToMessageId)?.content || '[Удалено]'}
                          </Text>
                        )}
                        <Text fontSize="sm" color="gray.500">{new Date(msg.sentAt).toLocaleString()}</Text>
                      </Box>
                    ))}
                  </Box>
                  <VStack spacing={4} align="stretch" mt={4}>
                    {documents.map((doc) => (
                      <Box key={doc.id} p={2} borderWidth={1} borderRadius="md">
                        <Text fontWeight="bold">{doc.fileName}</Text>
                        <Text>Дата: {new Date(doc.uploadedAt).toLocaleString()}</Text>
                        <Button as="a" href={doc.downloadUrl} colorScheme="teal" size="sm" mt={2}>
                          Скачать
                        </Button>
                        <Button
                          size="sm"
                          ml={2}
                          onClick={() => {
                            setAccessTarget({ type: 'document', id: doc.id });
                            setIsAccessModalOpen(true);
                          }}
                        >
                          Настроить доступ
                        </Button>
                      </Box>
                    ))}
                  </VStack>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    mt={4}
                    isDisabled={isSending || isLoadingContent}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleSendMessage}
                    mt={2}
                    isLoading={isSending}
                    loadingText="Отправка..."
                  >
                    Отправить
                  </Button>
                  <FormControl mt={4}>
                    <FormLabel>Загрузить документ</FormLabel>
                    <Input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      isDisabled={isSending || isLoadingContent}
                    />
                    <Button
                      colorScheme="teal"
                      onClick={handleUploadDocument}
                      mt={2}
                      isDisabled={!file}
                    >
                      Загрузить
                    </Button>
                  </FormControl>
                </>
              )}
            </>
          ) : (
            <Text>Выберите чат</Text>
          )}
        </Box>
      </Flex>

      {/* Модальное окно для создания чата */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Создать новый чат</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Название чата</FormLabel>
                <Input
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Введите название"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Тип чата</FormLabel>
                <Select value={chatType} onChange={(e) => setChatType(parseInt(e.target.value))}>
                  {CHAT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Пользователи</FormLabel>
                {users.map((user) => (
                  <Checkbox
                    key={user.userId}
                    isChecked={selectedUsers.includes(user.userId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.userId]);
                      } else {
                        setSelectedUsers(selectedUsers.filter((id) => id !== user.userId));
                      }
                    }}
                  >
                    {user.username}
                  </Checkbox>
                ))}
              </FormControl>
              <FormControl>
                <FormLabel>Правила доступа</FormLabel>
                <Select
                  value={accessRules.roleId}
                  onChange={(e) => setAccessRules({ ...accessRules, roleId: e.target.value })}
                >
                  <option value="">Выберите роль</option>
                  {roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.name}
                    </option>
                  ))}
                </Select>
                <Select
                  mt={2}
                  value={accessRules.access}
                  onChange={(e) => setAccessRules({ ...accessRules, access: parseInt(e.target.value) })}
                >
                  {ACCESS_FLAGS.map((flag) => (
                    <option key={flag.value} value={flag.value}>
                      {flag.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleCreateChat}>
              Создать
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно для правил доступа */}
      <Modal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Настроить доступ</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Тип действия</FormLabel>
                <Select
                  value={accessRules.accessType}
                  onChange={(e) => setAccessRules({ ...accessRules, accessType: e.target.value })}
                >
                  <option value="grant">Предоставить</option>
                  <option value="revoke">Отозвать</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Роль</FormLabel>
                <Select
                  value={accessRules.roleId}
                  onChange={(e) => setAccessRules({ ...accessRules, roleId: e.target.value })}
                >
                  <option value="">Выберите роль</option>
                  {roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Тип доступа</FormLabel>
                <Select
                  value={accessRules.access}
                  onChange={(e) => setAccessRules({ ...accessRules, access: parseInt(e.target.value) })}
                >
                  {ACCESS_FLAGS.map((flag) => (
                    <option key={flag.value} value={flag.value}>
                      {flag.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSetAccess}>
              Применить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно для редактирования сообщения */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Редактировать сообщение</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Текст сообщения</FormLabel>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Введите новый текст"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleEditMessage}>
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Footer />
    </Box>
  );
}

export default Dashboard;
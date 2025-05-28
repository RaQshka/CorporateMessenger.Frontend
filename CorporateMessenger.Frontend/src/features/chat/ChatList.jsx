import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  useToast,
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
} from '@chakra-ui/react';
import { createChat, addUserToChat, grantChatAccess, getUsers, getRoles } from '../../services/api';

const CHAT_TYPES = [
  { value: 0, label: 'Групповой чат' }, // ChatTypes.Group
  { value: 1, label: 'Диалог' },        // ChatTypes.Dialog
  { value: 2, label: 'Канал' },         // ChatTypes.Channel
];

function ChatList({ chats, setChats, onSelectChat, selectedChatId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatName, setChatName] = useState('');
  const [chatType, setChatType] = useState(CHAT_TYPES[0].value);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [accessRules, setAccessRules] = useState({ roleId: '', access: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Fetch users and roles
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
        description: 'Выберите хотя бы одного пользователя для диалога',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box w="30%" borderRightWidth={1} pr={4}>
      <Heading as="h3" size="md" mb={4}>Чаты</Heading>
      <Button colorScheme="blue" mb={4} onClick={() => setIsModalOpen(true)}>
        Создать чат
      </Button>
      {chats.length === 0 ? (
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
              bg={selectedChatId === chat.id ? 'blue.100' : 'white'}
              onClick={() => onSelectChat(chat)}
            >
              <Text fontWeight="bold">{chat.name}</Text>
              <Text fontSize="sm">
                Тип: {CHAT_TYPES.find((t) => t.value === parseInt(chat.type))?.label || chat.type}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
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
                  <option value={1}>Чтение</option>
                  <option value={4}>Запись</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleCreateChat} isLoading={isLoading}>
              Создать
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ChatList;
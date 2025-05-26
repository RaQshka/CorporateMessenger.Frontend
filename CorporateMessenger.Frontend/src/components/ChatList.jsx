import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  useToast,
  Link,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getUserChats, createChat } from '../services/api';

// Константы для типов чатов
const CHAT_TYPES = [
  { value: 'Group', label: 'Групповой чат' },
  { value: 'Private', label: 'Приватный чат' },
];

function ChatList() {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatName, setChatName] = useState('');
  const [chatType, setChatType] = useState(CHAT_TYPES[0].value);
  const toast = useToast();
  const navigate = useNavigate();

  // Загрузка списка чатов
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
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
          description: 'Не удалось загрузить список чатов. Попробуйте позже.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, [toast]);

  // Создание нового чата
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

    setIsCreating(true);
    try {
      await createChat({ name: chatName, type: chatType });
      const data = await getUserChats();
      setChats(data);
      setIsModalOpen(false);
      setChatName('');
      setChatType(CHAT_TYPES[0].value);
      toast({
        title: 'Успех',
        description: 'Чат успешно создан',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат. Попробуйте позже.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box p={4}>
      <Heading as="h2" mb={4}>
        Мои чаты
      </Heading>
      <Button
        colorScheme="blue"
        mb={4}
        onClick={() => setIsModalOpen(true)}
        isDisabled={isLoading}
      >
        Создать новый чат
      </Button>
      {isLoading ? (
        <Text>Загрузка...</Text>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : chats.length === 0 ? (
        <Text>У вас пока нет чатов</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {chats.map((chat) => (
            <Link
              as={RouterLink}
              to={`/chat/${chat.chatId}`}
              key={chat.chatId}
              _hover={{ textDecoration: 'none' }}
            >
              <Box p={4} borderWidth={1} borderRadius="lg" _hover={{ bg: 'gray.100' }}>
                <Text fontWeight="bold">{chat.name}</Text>
                <Text>Тип: {CHAT_TYPES.find((t) => t.value === chat.type)?.label || chat.type}</Text>
              </Box>
            </Link>
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
              <Input
                placeholder="Название чата"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                isDisabled={isCreating}
              />
              <Select
                value={chatType}
                onChange={(e) => setChatType(e.target.value)}
                isDisabled={isCreating}
              >
                {CHAT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={handleCreateChat}
              isLoading={isCreating}
              loadingText="Создание..."
            >
              Создать
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ChatList;
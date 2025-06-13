import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { createChat, getUserChats } from '../../services/api';

const CHAT_TYPES = [
  { value: 0, label: 'Групповой чат' }, // ChatTypes.Group
  { value: 1, label: 'Диалог' },        // ChatTypes.Dialog
  { value: 2, label: 'Канал' },         // ChatTypes.Channel
];

function CreateChatModal({ isOpen, onClose, setChats }) {
  const [chatName, setChatName] = useState('');
  const [chatType, setChatType] = useState(CHAT_TYPES[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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

    setIsLoading(true);
    try {
      const response = await createChat({ name: chatName, type: chatType });
      if (response.chatId) {
        const data = await getUserChats();
        setChats(data);
        onClose();
        setChatName('');
        setChatType(CHAT_TYPES[0].value);
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Создать новый чат</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Название чата</FormLabel>
            <Input
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Введите название"
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Тип чата</FormLabel>
            <Select value={chatType} onChange={(e) => setChatType(parseInt(e.target.value))}>
              {CHAT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleCreateChat} isLoading={isLoading}>
            Создать
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateChatModal;
import { useState } from 'react';
import {
  Box,
  Text,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { editMessage, deleteMessage, addReaction, removeReaction } from '../../services/api';

function MessageItem({ message, userId, onUpdate, canDeleteAnyMessages, onReply }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const toast = useToast();
  const isSender = message.sender.id === userId; // Предполагаем, что senderId доступен, иначе используйте логику проверки
  const canEdit = isSender;
  const canDelete = isSender || canDeleteAnyMessages;

  // Функция для получения эмодзи по типу реакции
  const getEmoji = (reactionType) => {
    switch (reactionType) {
      case 0: return '👍'; // Like
      case 1: return '❤️'; // Heart
      case 2: return '😢'; // Sad
      case 3: return '😊'; // Happy
      case 4: return '😭'; // Cry
      case 5: return '😂'; // Laugh
      default: return '';
    }
  };

  // Редактирование сообщения
  const handleEdit = async () => {
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
      await editMessage(message.id, { newContent: editContent });
      setIsEditing(false);
      onUpdate();
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
  const handleDelete = async () => {
    try {
      await deleteMessage(message.id);
      onUpdate();
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

// Новая функция для преобразования числа в строку
const getReactionString = (type) => {
  switch (type) {
    case 1: return 'Like';
    case 2: return 'Heart';
    case 3: return 'Sad';
    case 4: return 'Happy';
    case 5: return 'Cry';
    case 6: return 'Laugh';
    default: return '';
  }
};

// Обновленная функция handleAddReaction
const handleAddReaction = async (reactionType) => {
  try {
    const reactionString = getReactionString(reactionType); // Преобразуем число в строку
    if (!reactionString) {
      throw new Error('Некорректный тип реакции');
    }
    await addReaction(message.id, { reactionType: reactionString }); // Передаем строку
    
    onUpdate();
    toast({
      title: 'Успех',
      description: 'Реакция обновлена',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  } catch (err) {
    console.error('Ошибка при обновлении реакции:', err); // Добавляем логирование для диагностики
    toast({
      title: 'Ошибка',
      description: 'Не удалось обновить реакцию.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }
};

  return (
    <>
      <Box
        p={2}
        borderWidth={1}
        borderRadius="md"
        mb={2}
        alignSelf={isSender ? 'flex-end' : 'flex-start'}
        bg={isSender ? '#27AE60' : '#2C3E50'}
        color="white"
        maxW="60%"
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
      >
        <HStack justify="space-between" align="start">
          <Text fontWeight="bold">
            {message.sender.firstName} {message.sender.lastName}
          </Text>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              size="xs"
              variant="ghost"
              color="#7F8C8D"
              _hover={{ color: '#3498DB' }}
                        />
            <MenuList bg="#FFFFFF" boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)" w="200px">
              <MenuItem onClick={() => handleAddReaction(1)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Like 👍
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction(2)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Heart ❤️
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction(3)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Sad 😢
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction(4)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Happy 😊
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction(5)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Cry 😭
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction(6)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Laugh 😂
              </MenuItem>
              <MenuDivider />
              {/* Добавляем опцию "Ответить" */}
              <MenuItem onClick={() => onReply(message.id)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Ответить 💬
              </MenuItem>
              {canEdit && (
                <MenuItem onClick={() => setIsEditing(true)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                  Редактировать ✏️
                </MenuItem>
              )}
              {canDelete && (
                <MenuItem onClick={handleDelete} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                  Удалить 🗑️
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </HStack>
        <Text>{message.isDeleted ? '[Удалено]' : message.content}</Text>
        <Text fontSize="sm" color="gray.200">
          {new Date(message.sentAt).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </Text>
        {message.reactions && message.reactions.length > 0 && (
          <HStack spacing={2} mt={1}>
            {message.reactions
              .filter((reaction) => reaction.reactionCount > 0)
              .map((reaction, index) => (
                <Text key={index} fontSize="xs" color="gray.300">
                  {reaction.reactionCount} {getEmoji(reaction.reactionType)}
                </Text>
              ))}
          </HStack>
        )}
      </Box>
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
            <Button colorScheme="blue" onClick={handleEdit}>
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default MessageItem;
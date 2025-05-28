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

function MessageItem({ message, userId, onUpdate, canDeleteAnyMessages }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const toast = useToast();
  const isSender = message.senderId === userId;
  const canEdit = isSender;
  const canDelete = isSender || canDeleteAnyMessages;

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

  const handleAddReaction = async (reactionType) => {
    try {
      await addReaction(message.id, { reactionType });
      onUpdate();
      toast({
        title: 'Успех',
        description: 'Реакция добавлена',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить реакцию.',
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
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              size="sm"
              variant="ghost"
              color="#7F8C8D"
              _hover={{ color: '#3498DB' }}
            />
            <MenuList bg="#FFFFFF" boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)" w="200px">
              <MenuItem onClick={() => handleAddReaction('Like')} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Like 👍
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction('Heart')} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Heart ❤️
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction('Sad')} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Sad 😢
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction('Happy')} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Happy 😊
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction('Cry')} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Cry 😭
              </MenuItem>
              <MenuItem onClick={() => handleAddReaction('Laugh')} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Laugh 😂
              </MenuItem>
              <MenuDivider />
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
          <Text fontWeight="bold">{message.senderName}</Text>
        </HStack>
        <Text>{message.isDeleted ? '[Удалено]' : message.content}</Text>
        <Text fontSize="sm" color="gray.200">
          {new Date(message.sentAt).toLocaleString()}
        </Text>
        {message.reactions && message.reactions.length > 0 && (
          <HStack spacing={1} mt={1}>
            {message.reactions.map((reaction, index) => (
              <Text key={index} fontSize="sm">
                {reaction === 'Like' && '👍'}
                {reaction === 'Heart' && '❤️'}
                {reaction === 'Sad' && '😢'}
                {reaction === 'Happy' && '😊'}
                {reaction === 'Cry' && '😭'}
                {reaction === 'Laugh' && '😂'}
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
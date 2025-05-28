import { useState } from 'react';
import {
  Box,
  Text,
  HStack,
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
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { editMessage, deleteMessage } from '../../services/api';

function MessageItem({ message, userId, onUpdate, canDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const toast = useToast();

  const isSender = message.senderId === userId;

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

  return (
    <>
      <Box
        p={2}
        borderWidth={1}
        borderRadius="md"
        mb={2}
        alignSelf={isSender ? 'flex-end' : 'flex-start'}
        bg={isSender ? 'blue.100' : 'gray.100'}
      >
        <HStack justify="space-between">
          <Text fontWeight="bold">{message.senderName}</Text>
          <HStack>
            {isSender && !message.isDeleted && (
              <IconButton
                size="sm"
                icon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                aria-label="Edit message"
              />
            )}
            {(isSender || canDelete) && !message.isDeleted && (
              <IconButton
                size="sm"
                icon={<DeleteIcon />}
                onClick={handleDelete}
                aria-label="Delete message"
              />
            )}
          </HStack>
        </HStack>
        <Text>{message.isDeleted ? '[Удалено]' : message.content}</Text>
        <Text fontSize="sm" color="gray.500">{new Date(message.sentAt).toLocaleString()}</Text>
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
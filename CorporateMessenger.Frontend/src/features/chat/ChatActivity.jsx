import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  IconButton,
  Text,
  useToast,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import { getChatActivity, sendMessage, uploadDocument } from '../../services/api';
import MessageItem from './MessageItem';
import DocumentItem from './DocumentItem';

function ChatActivity({ chatId, userId, connection, userPermissions }) {
  const [activities, setActivities] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState(null);
  const activitiesRef = useRef(null);
  const toast = useToast();

  const canDeleteAnyMessages = (userPermissions & 8) === 8;
  const canDeleteAnyDocuments = (userPermissions & 4) === 4;

  const fetchActivities = async (skipValue, append = false) => {
    setIsLoading(true);
    try {
      const data = await getChatActivity(chatId, skipValue, 50);
      if (Array.isArray(data)) {
        const sortedActivities = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setActivities((prev) => (append ? [...sortedActivities, ...prev] : sortedActivities));
        setHasMore(data.length === 50);
      } else {
        throw new Error('Invalid activity data format');
      }
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить активность.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      setSkip(0);
      fetchActivities(0);
    }
  }, [chatId]);

  useEffect(() => {
    if (connection && chatId) {
      const handleReceiveMessage = () => fetchActivities(skip);
      const handleReceiveDocument = () => fetchActivities(skip);

      connection.on('ReceiveMessage', handleReceiveMessage);
      connection.on('ReceiveDocument', handleReceiveDocument);

      return () => {
        connection.off('ReceiveMessage', handleReceiveMessage);
        connection.off('ReceiveDocument', handleReceiveDocument);
      };
    }
  }, [connection, chatId, skip]);

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
      await sendMessage({ chatId, content: message });
      setMessage('');
      fetchActivities(skip);
      activitiesRef.current.scrollTop = activitiesRef.current.scrollHeight;
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    setIsSending(true);
    try {
      await uploadDocument({ file, chatId });
      setFile(null);
      fetchActivities(skip);
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
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (file) handleUploadDocument(); // Auto-upload when file is selected
  }, [file]);

  return (
    <VStack spacing={3} align="stretch" bg="#F5F6FA">
      <Box
        ref={activitiesRef}
        maxH="60vh"
        overflowY="auto"
        p={2}
        borderWidth={1}
        borderRadius="md"
        bg="#FFFFFF"
      >
        {isLoading && <Text>Загрузка...</Text>}
        {activities.map((activity) => (
          activity.type === 'Message' ? (
            <MessageItem
              key={activity.id}
              message={activity.data}
              userId={userId}
              onUpdate={() => fetchActivities(skip)}
              canDeleteAnyMessages={canDeleteAnyMessages}
            />
          ) : (
            <DocumentItem
              key={activity.id}
              document={activity.data}
              userId={userId}
              onUpdate={() => fetchActivities(skip)}
              canDeleteAnyDocuments={canDeleteAnyDocuments}
            />
          )
        ))}
      </Box>
      <HStack spacing={2} align="stretch">
        <IconButton
          icon={<AttachmentIcon />}
          onClick={() => document.getElementById('file-input').click()}
          aria-label="Upload document"
          isDisabled={isSending || isLoading}
        />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          isDisabled={isSending || isLoading}
          bg="#FFFFFF"
          borderColor="#E2E8F0"
        />
        <Button
          colorScheme="blue"
          onClick={handleSendMessage}
          isLoading={isSending}
          loadingText="Отправка..."
        >
          Отправить
        </Button>
      </HStack>
      <input
        id="file-input"
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => setFile(e.target.files[0])}
      />
    </VStack>
  );
}

export default ChatActivity;
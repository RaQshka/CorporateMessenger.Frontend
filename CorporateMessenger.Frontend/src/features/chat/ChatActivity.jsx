import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Text,
  useToast,
} from '@chakra-ui/react';
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

  const canDeleteMessages = (userPermissions & 8) === 8; // Example bit for DeleteMessage
  const canDeleteDocuments = (userPermissions & 4) === 4; // Example bit for DeleteDocument

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

  const handleScroll = () => {
    if (activitiesRef.current?.scrollTop === 0 && hasMore && !isLoading) {
      setIsLoading(true);
      const newSkip = skip + 50;
      fetchActivities(newSkip, true).then(() => {
        setSkip(newSkip);
        setIsLoading(false);
      });
    }
  };

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
      activitiesRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

  return (
    <VStack spacing={4} align="stretch">
      <Box
        ref={activitiesRef}
        maxH="60vh"
        overflowY="auto"
        p={2}
        borderWidth={1}
        borderRadius="md"
        onScroll={handleScroll}
      >
        {isLoading && <Text>Загрузка...</Text>}
        {activities.map((activity) => (
          activity.type === 'Message' ? (
            <MessageItem
              key={activity.id}
              message={activity.data}
              userId={userId}
              onUpdate={() => fetchActivities(skip)}
              canDelete={canDeleteMessages}
            />
          ) : (
            <DocumentItem
              key={activity.id}
              document={activity.data}
              userId={userId}
              onUpdate={() => fetchActivities(skip)}
              canDelete={canDeleteDocuments}
            />
          )
        ))}
      </Box>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Введите сообщение..."
        isDisabled={isSending || isLoading}
      />
      <Button
        colorScheme="blue"
        onClick={handleSendMessage}
        isLoading={isSending}
        loadingText="Отправка..."
      >
        Отправить
      </Button>
      <FormControl>
        <FormLabel>Загрузить документ</FormLabel>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          isDisabled={isSending || isLoading}
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
    </VStack>
  );
}

export default ChatActivity;
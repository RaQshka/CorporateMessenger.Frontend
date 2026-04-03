// features/chat/ChatActivity.jsx
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
  Flex,
  Avatar,
  Badge,
  CloseButton,
  useColorModeValue
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
  const [replyToMessage, setReplyToMessage] = useState(null);
  const activitiesRef = useRef(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const replyBg = useColorModeValue('blue.50', 'blue.900');
  const replyBorder = useColorModeValue('blue.200', 'blue.700');
  const scrollbarThumb = useColorModeValue('gray.400', 'gray.500');
  const scrollbarTrack = useColorModeValue('gray.100', 'gray.700');
  const userMessageBg = useColorModeValue('blue.100', 'blue.900');
  const otherMessageBg = useColorModeValue('gray.100', 'gray.700');

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
      setTimeout(() => {
        if (activitiesRef.current) {
          activitiesRef.current.scrollTop = activitiesRef.current.scrollHeight;
        }
      }, 100);
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
      await sendMessage({ 
        chatId, 
        content: message, 
        replyToMessageId: replyToMessage?.id 
      });
      setMessage('');
      setReplyToMessage(null);
      fetchActivities(skip);
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

  const handleReply = (message) => {
    setReplyToMessage(message);
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
    if (file) handleUploadDocument();
  }, [file]);

  return (
    <Box 
      display="flex"
      flexDirection="column"
      h="85vh"
      w="100%"
      overflow="hidden"
    >
      <Box
        ref={activitiesRef}
        flex="1"
        overflowY="auto"
        p={4}
        bg={bgColor}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: scrollbarTrack,
            borderRadius: '4px',
            marginY: '2px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollbarThumb,
            borderRadius: '4px',
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: useColorModeValue('gray.500', 'gray.400'),
          },
          scrollbarWidth: 'thin',
          scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}`,
        }}
      >
        {isLoading && skip === 0 && (
          <Flex justify="center" py={4}>
            <Text color="gray.500">Загрузка сообщений...</Text>
          </Flex>
        )}
        
        {activities.length === 0 && !isLoading && (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            h="100%"
            py={10}
            color="gray.500"
          >
            <Text fontSize="lg" mb={2}>Нет сообщений</Text>
            <Text textAlign="center" maxW="md">
              Начните общение - отправьте первое сообщение или прикрепите файл
            </Text>
          </Flex>
        )}
        
        <VStack align="stretch" spacing={3}>
          {activities.map((activity) => (
            activity.type === 'Message' ? (
              <MessageItem
                key={activity.id}
                message={activity.data}
                userId={userId}
                onUpdate={() => fetchActivities(skip)}
                onReply={handleReply}
                canDeleteAnyMessages={canDeleteAnyMessages}
                userMessageBg={userMessageBg}
                otherMessageBg={otherMessageBg}
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
        </VStack>
        
        {hasMore && !isLoading && (
          <Flex justify="center" mt={4}>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const newSkip = skip + 50;
                setSkip(newSkip);
                fetchActivities(newSkip, true);
              }}
            >
              Загрузить больше
            </Button>
          </Flex>
        )}
      </Box>
      
      {replyToMessage && (
        <Flex 
          p={3} 
          borderRadius="md" 
          bg={replyBg}
          borderLeftWidth="4px"
          borderLeftColor={replyBorder}
          align="center"
          justify="space-between"
        >
          <Box flex="1" mr={2}>
            <Text fontWeight="bold" fontSize="sm">
              Ответ на: {replyToMessage.senderName || "Пользователь"}
            </Text>
            <Text fontSize="sm" isTruncated>
              {replyToMessage.content}
            </Text>
          </Box>
          <CloseButton 
            size="sm" 
            onClick={() => setReplyToMessage(null)} 
          />
        </Flex>
      )}
      
      <Box p={3} borderTopWidth="1px" borderColor={borderColor}>
        <HStack>
          <IconButton
            icon={<AttachmentIcon />}
            onClick={() => document.getElementById('file-input').click()}
            aria-label="Прикрепить файл"
            variant="ghost"
          />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            isDisabled={isSending || isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            isLoading={isSending}
            px={6}
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
      </Box>
    </Box>
  );
}

export default ChatActivity;
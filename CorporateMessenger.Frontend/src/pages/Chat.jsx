import { useState, useEffect } from 'react';
import { Box, Button, Input, VStack, Text,Heading, useToast } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage } from '../services/api';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(chatId);
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          throw new Error('Неверный формат данных');
        }
      } catch (err) {
        setError('Не удалось загрузить сообщения');
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить сообщения.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [chatId, toast]);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5056/chatHub')
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          connection.on('ReceiveMessage', () => {
            getMessages(chatId).then((data) => {
              if (Array.isArray(data)) setMessages(data);
            });
          });
          connection.on('ReceiveDocument', () => {
            getMessages(chatId).then((data) => {
              if (Array.isArray(data)) setMessages(data);
            });
          });
        })
        .catch((err) => console.error('Ошибка SignalR:', err));
    }
    return () => {
      if (connection) connection.stop();
    };
  }, [connection, chatId]);

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
      const data = await getMessages(chatId);
      setMessages(data);
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

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={6}>
        <Heading as="h2" mb={4}>Чат</Heading>
        {isLoading ? (
          <Text>Загрузка...</Text>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : messages.length === 0 ? (
          <Text>Сообщений пока нет</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {messages.map((msg) => (
              <Box key={msg.messageId} p={2} borderWidth={1} borderRadius="lg">
                <Text>{msg.content}</Text>
              </Box>
            ))}
          </VStack>
        )}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Введите сообщение..."
          mt={4}
          isDisabled={isSending || isLoading}
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
      </Box>
      <Footer />
    </Box>
  );
}

export default Chat;
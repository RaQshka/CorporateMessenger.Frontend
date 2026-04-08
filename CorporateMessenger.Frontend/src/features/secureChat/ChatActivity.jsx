import { useState, useEffect, useRef } from 'react';
import { 
  Box, VStack, HStack, Input, Button, 
  IconButton, useToast, Text, Avatar,
  Spinner, Badge, Tooltip
} from '@chakra-ui/react';
import { FaPaperPlane, FaFile, FaPaperclip, FaSmile } from 'react-icons/fa';
import { getSecureChatActivity, uploadEncryptedDocument } from '../../services/api';
import { EncryptionService } from './EncryptionService';
import EncryptedMessage from './EncryptedMessage';
import EncryptedDocument from './EncryptedDocument';

function ChatActivity({ chatId, aesKey, userId, connection }) {
  const [activities, setActivities] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activities]);

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const data = await getSecureChatActivity(chatId);
        setActivities(data || []);
      } catch (error) {
        console.error('Error loading activities:', error);
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить историю чата',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();

    if (connection) {
      const receiveMessageHandler = (message) => {
        setActivities(prev => [...prev, { ...message, type: 'Message' }]);
      };

      const receiveDocumentHandler = (document) => {
        setActivities(prev => [...prev, { ...document, type: 'Document' }]);
      };

      connection.on("ReceiveEncryptedMessage", receiveMessageHandler);
      connection.on("ReceiveEncryptedDocument", receiveDocumentHandler);

      return () => {
        connection.off("ReceiveEncryptedMessage", receiveMessageHandler);
        connection.off("ReceiveEncryptedDocument", receiveDocumentHandler);
      };
    }
  }, [chatId, connection]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Сообщение не может быть пустым',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!aesKey) {
      toast({
        title: 'Ошибка шифрования',
        description: 'Ключ шифрования не найден',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSending(true);
    try {
      const encrypted = await EncryptionService.encryptData(aesKey, newMessage);
      
      const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted.ciphertext)));
      const iv = btoa(String.fromCharCode(...new Uint8Array(encrypted.iv)));
      const tag = btoa(String.fromCharCode(...new Uint8Array(encrypted.tag)));

      await connection.invoke("SendEncryptedMessage", chatId, ciphertext, iv, tag);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка отправки',
        description: 'Не удалось отправить сообщение',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSendDocument = async () => {
    if (!file) return;
    
    if (!aesKey) {
      toast({
        title: 'Ошибка шифрования',
        description: 'Ключ шифрования не найден',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSending(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result;
        const encrypted = await EncryptionService.encryptData(aesKey, fileData);
        
        const response = await uploadEncryptedDocument({
          secureChatId: chatId,
          fileData: btoa(String.fromCharCode(...new Uint8Array(encrypted.ciphertext))),
          iv: btoa(String.fromCharCode(...new Uint8Array(encrypted.iv))),
          tag: btoa(String.fromCharCode(...new Uint8Array(encrypted.tag))),
          fileName: file.name,
          fileType: file.type,
          uploaderId: userId
        });
        
        await connection.invoke("EncryptedDocumentUploaded", chatId, response.documentId);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast({
          title: 'Файл отправлен',
          description: 'Документ успешно загружен в чат',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error sending document:', error);
      toast({
        title: 'Ошибка отправки файла',
        description: 'Не удалось отправить файл',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box display="flex" flexDirection="column" h="70vh">
      {/* Заголовок области сообщений */}
      <Box 
        p={4} 
        bg="blue.50" 
        borderBottom="1px solid" 
        borderColor="blue.200"
        borderRadius="lg lg 0 0"
      >
        <HStack justify="space-between">
          <Text fontWeight="semibold" color="blue.800">
            Сообщения
          </Text>
          <Badge colorScheme="green">Защищено</Badge>
        </HStack>
      </Box>

      {/* Область сообщений */}
      <Box 
        flex="1" 
        overflowY="auto" 
        p={4} 
        bg="gray.50"
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
            background: '#edf2f7',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '3px',
          },
        }}
      >
        <VStack spacing={3} align="stretch">
          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.500">Загрузка сообщений...</Text>
            </Box>
          ) : activities.length === 0 ? (
            <Box textAlign="center" py={10} color="gray.400">
              <Text fontSize="lg">📭</Text>
              <Text mt={2}>Пока нет сообщений</Text>
              <Text fontSize="sm">Отправьте первое сообщение!</Text>
            </Box>
          ) : (
            activities.map((activity) => (
              activity.type === 'Message' ? (
                <EncryptedMessage 
                  key={activity.id} 
                  activity={activity} 
                  aesKey={aesKey} 
                  userId={userId} 
                />
              ) : (
                <EncryptedDocument 
                  key={activity.id} 
                  activity={activity} 
                  aesKey={aesKey} 
                  userId={userId} 
                />
              )
            ))
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Область ввода */}
      <Box 
        p={4} 
        bg="white" 
        borderTop="1px solid" 
        borderColor="gray.200"
        borderRadius="0 0 lg lg"
        boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
      >
        {/* Прикрепленный файл */}
        {file && (
          <HStack mb={3} p={3} bg="blue.50" borderRadius="md" justify="space-between">
            <HStack>
              <FaFile color="#4299e1" />
              <Text fontSize="sm" color="blue.700" noOfLines={1}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Text>
            </HStack>
            <Button 
              size="xs" 
              colorScheme="red" 
              variant="ghost"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Удалить
            </Button>
          </HStack>
        )}

        <HStack spacing={3}>
          {/* Кнопка прикрепления файла */}
          <Tooltip label="Прикрепить файл" placement="top">
            <IconButton
              icon={<FaPaperclip />}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Прикрепить файл"
              colorScheme="gray"
              variant="outline"
              isDisabled={isSending}
            />
          </Tooltip>
          
          {/* Скрытый input для файла */}
          <input 
            type="file" 
            onChange={handleFileSelect} 
            style={{ display: 'none' }}
            ref={fileInputRef}
            id="file-upload"
          />

          {/* Поле ввода сообщения */}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            size="md"
            flex="1"
            bg="gray.50"
            borderColor="gray.300"
            _hover={{ borderColor: 'blue.400' }}
            focusBorderColor="blue.500"
            isDisabled={isSending}
          />

          {/* Кнопка отправки */}
          <Tooltip label="Отправить (Enter)" placement="top">
            <IconButton
              icon={isSending ? <Spinner size="sm" /> : <FaPaperPlane />}
              onClick={handleSendMessage}
              aria-label="Отправить сообщение"
              colorScheme="blue"
              isLoading={isSending}
            />
          </Tooltip>

          {/* Кнопка отправки файла */}
          {file && (
            <Button
              leftIcon={<FaFile />}
              onClick={handleSendDocument}
              colorScheme="green"
              isLoading={isSending}
              loadingText="Отправка..."
            >
              Отправить
            </Button>
          )}
        </HStack>
      </Box>
    </Box>
  );
}

export default ChatActivity;
import { useState, useEffect } from 'react';
import { 
  Box, VStack, HStack, Input, Button, 
  IconButton, useToast 
} from '@chakra-ui/react';
import { FaPaperPlane, FaFile } from 'react-icons/fa';
import { getSecureChatActivity, uploadEncryptedDocument } from '../../services/api';
import { EncryptionService } from './EncryptionService';
import EncryptedMessage from './EncryptedMessage';
import EncryptedDocument from './EncryptedDocument';

function ChatActivity({ chatId, aesKey, userId, connection }) {
  const [activities, setActivities] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getSecureChatActivity(chatId);
        setActivities(data || []);
      } catch (error) {
        console.error('Error loading activities:', error);
      }
    };

    loadActivities();

    if (connection) {
      const receiveMessageHandler = (message) => {
        setActivities(prev => [message, ...prev]);
      };

      const receiveDocumentHandler = (document) => {
        setActivities(prev => [document, ...prev]);
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
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSendDocument = async () => {
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result;
        const encrypted = await EncryptionService.encryptData(aesKey, fileData);
        
        const response = await uploadEncryptedDocument({
          secureChatId: chatId,
          fileData: encrypted.ciphertext,
          iv: encrypted.iv,
          tag: encrypted.tag,
          fileName: file.name,
          fileType: file.type,
          uploaderId: userId
        });
        
        await connection.invoke("EncryptedDocumentUploaded", chatId, response.documentId);
        setFile(null);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error sending document:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить файл',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Box p={4} borderWidth={1} borderRadius="md" maxH="60vh" overflowY="auto">
        <VStack align="stretch" spacing={2}>
          
        <Box
                bg={'gray.100'}
                p={3}
                borderRadius="md"
                maxW="80%"
                alignSelf={'flex-end'}
                >
                Здравствуйте, мне нужно обсудить очень важное дело
                <div fontSize="xs" color="gray.500">
                    {new Date().toLocaleTimeString()} - Игорь Потапов
                </div>
                </Box>
          {activities.map((activity) => (
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
          ))}
        </VStack>
      </Box>

      <HStack mt={4}>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение"
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <IconButton
          icon={<FaPaperPlane />}
          onClick={handleSendMessage}
          aria-label="Отправить сообщение"
        />
        
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button as="span" leftIcon={<FaFile />}>
            Файл
          </Button>
        </label>
        {file && (
          <Button onClick={handleSendDocument}>
            Отправить {file.name}
          </Button>
        )}
      </HStack>
    </Box>
  );
}

export default ChatActivity;
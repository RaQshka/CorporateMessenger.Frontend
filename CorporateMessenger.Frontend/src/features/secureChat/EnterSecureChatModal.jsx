import { useState } from 'react';
import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalCloseButton, ModalBody, ModalFooter, 
  Button, Input, FormControl, FormLabel,
  useToast 
} from '@chakra-ui/react';
import { enterSecureChat } from '../../services/api';
import { EncryptionService } from './EncryptionService';

function EnterSecureChatModal({ isOpen, onClose, onChatEntered, userId }) {
  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleEnter = async () => {
    if (!accessKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите код доступа',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Генерация ключевой пары
      const keyPair = await EncryptionService.generateKeyPair();
      
      // 2. Экспорт публичного ключа в формате Base64
      const publicKey = await EncryptionService.exportPublicKey(keyPair.publicKey);
      
      // 3. Отправка запроса на сервер
      const response = await enterSecureChat({
        accessKey,
        publicKey: publicKey,
        userId
      });

      console.log('Server response:', response); // Добавьте лог для отладки

      // Проверяем, что otherPublicKey существует и в правильном формате
      if (!response.otherPublicKey) {
        throw new Error('Сервер не вернул публичный ключ собеседника');
      }

      // 4. Вычисление общего секретного ключа
      const aesKey = await EncryptionService.deriveSharedSecret(
        keyPair.privateKey, 
        response.otherPublicKey
      );

      // 5. Передача данных в родительский компонент
      onChatEntered({
        chatId: response.chatId,
        aesKey,
        privateKey: keyPair.privateKey,
        otherPublicKey: response.otherPublicKey,
        accessKey,
        isCreator: false,
        salt: response.salt
      });
      
      onClose();
    } catch (error) {
      console.error('Ошибка входа в чат:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось войти в чат. Проверьте код доступа',
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
        <ModalHeader>Войти в чат</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Код доступа</FormLabel>
            <Input 
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Введите код доступа"
              autoFocus
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            onClick={handleEnter}
            isLoading={isLoading}
            loadingText="Вход..."
          >
            Войти
          </Button>
          <Button variant="ghost" onClick={onClose} ml={3}>
            Отмена
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default EnterSecureChatModal;
import { useState } from 'react';
import {
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
import { enterSecureChat } from '../../services/api';
import { generateKeyPair, computeSharedSecret, deriveAESKey } from './EncryptionService';

function EnterSecureChatModal({ isOpen, onClose, onChatEntered, userId }) {
  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleEnter = async () => {
    if (!accessKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Код доступа обязателен',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { publicKey, privateKey, cryptoKeyPair } = await generateKeyPair();
      const response = await enterSecureChat({
        accessKey,
        userId,
        publicKey,
      });
      const sharedSecret = await computeSharedSecret(privateKey, response.otherPublicKey);
      const aesKey = await deriveAESKey(sharedSecret);
      onChatEntered({
        chatId: response.chatId,
        salt: response.salt, // base64
        otherPublicKey: response.otherPublicKey, // base64
        privateKey,
        cryptoKeyPair,
        sharedSecret,
        aesKey,
      });
      toast({
        title: 'Успех',
        description: 'Вход в чат выполнен.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setAccessKey('');
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти в чат.',
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
      <ModalContent bg="white.800" color="black">
        <ModalHeader>Войти в защищенный чат</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Код доступа</FormLabel>
            <Input
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Введите код доступа"
              bg="gray.700"
              borderColor="gray.600"
              _hover={{ borderColor: 'gray.500' }}
              focusBorderColor="blue.500"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleEnter}
            isLoading={isLoading}
            bg="blue.600"
            _hover={{ bg: 'blue.500' }}
          >
            Войти
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default EnterSecureChatModal;
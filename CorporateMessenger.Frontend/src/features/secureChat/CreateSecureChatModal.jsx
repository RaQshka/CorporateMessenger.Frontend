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
import { createSecureChat } from '../../services/api';
import { generateKeyPair } from './EncryptionService';
import SecureChatUserSelect from './SecureChatUserSelect';

function CreateSecureChatModal({ isOpen, onClose, onChatCreated, userId }) {
  const [chatName, setChatName] = useState('');
  const [invitedUser, setInvitedUser] = useState(null);
  const [destroyAt, setDestroyAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleCreate = async () => {
    if (!chatName.trim() || !invitedUser || !destroyAt) {
      toast({
        title: 'Ошибка',
        description: 'Все поля обязательны',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { publicKey, privateKey, cryptoKeyPair } = await generateKeyPair();
      const response = await createSecureChat({
        name: chatName,
        invitedUserId: invitedUser.id,
        destroyAt: new Date(destroyAt).toISOString(),
        creatorPublicKey: publicKey,
      });
      const sharedSecret = await computeSharedSecret(privateKey, response.creatorPublicKey);
      const aesKey = await deriveAESKey(sharedSecret);
      onChatCreated({
        accessKey: response.accessKey,
        salt: response.salt,
        creatorPublicKey: response.creatorPublicKey,
        privateKey,
        cryptoKeyPair,
        chatName,
        invitedUserId: invitedUser.id,
        aesKey,
      });
      toast({
        title: 'Успех',
        description: `Чат создан. Код доступа: ${response.accessKey}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      setChatName('');
      setInvitedUser(null);
      setDestroyAt('');
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setInvitedUser(user);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Создать защищенный чат</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Название чата</FormLabel>
            <Input
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Введите название"
            />
          </FormControl>
          <FormControl isRequired mt={4}>
            <FormLabel>Приглашенный пользователь</FormLabel>
            <SecureChatUserSelect onSelectUser={handleSelectUser} selectedUser={invitedUser} />
          </FormControl>
          <FormControl isRequired mt={4}>
            <FormLabel>Время уничтожения</FormLabel>
            <Input
              type="datetime-local"
              value={destroyAt}
              onChange={(e) => setDestroyAt(e.target.value)}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleCreate}
            isLoading={isLoading}
            isDisabled={!invitedUser}
          >
            
            Создать
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateSecureChatModal;
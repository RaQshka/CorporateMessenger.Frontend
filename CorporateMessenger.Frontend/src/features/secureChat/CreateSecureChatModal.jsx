import { useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Input, FormControl, FormLabel } from '@chakra-ui/react';
import { createSecureChat } from '../../services/api';
import { EncryptionService } from './EncryptionService';
import SecureChatUserSelect from './SecureChatUserSelect';

function CreateSecureChatModal({ isOpen, onClose, onChatCreated, userId }) {
  const [chatName, setChatName] = useState('');
  const [invitedUser, setInvitedUser] = useState(null);
  const [destroyAt, setDestroyAt] = useState('');

  const handleSelectUser = (user) => {
    setInvitedUser(user);
  };

  const handleCreate = async () => {
    const keyPair = await EncryptionService.generateKeyPair();
    const publicKey = await EncryptionService.exportPublicKey(keyPair.publicKey);
    const data = {
      name: chatName,
      invitedUserId: invitedUser.id,
      destroyAt,
      creatorPublicKey: publicKey,
    };
    const response = await createSecureChat(data);
    const aesKey = await EncryptionService.deriveSharedSecret(keyPair.privateKey, response.creatorPublicKey);
    onChatCreated({
      chatId: response.chatId,
      aesKey,
      privateKey: keyPair.privateKey,
      otherPublicKey: response.creatorPublicKey,
      accessKey: response.accessKey,
      isCreator: true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="90vw" w="550px">
        <ModalHeader>Создать чат</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Название чата</FormLabel>
            <Input value={chatName} onChange={(e) => setChatName(e.target.value)} />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Приглашенный пользователь</FormLabel>
            <SecureChatUserSelect onSelectUser={handleSelectUser} selectedUser={invitedUser} />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Время уничтожения</FormLabel>
            <Input type="datetime-local" value={destroyAt} onChange={(e) => setDestroyAt(e.target.value)} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleCreate} isDisabled={!invitedUser}>Создать</Button>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateSecureChatModal;
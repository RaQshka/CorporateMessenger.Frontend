import { useState } from 'react';
import {
  Box,
  Text,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { deleteDocument } from '../../services/api';
import DocumentAccessModal from './DocumentAccessModal';

function DocumentItem({ document, userId, onUpdate, canDelete }) {
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const toast = useToast();
  const isSender = document.senderId === userId;

  const handleDelete = async () => {
    try {
      await deleteDocument(document.id);
      onUpdate();
      toast({
        title: 'Успех',
        description: 'Документ удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить документ.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Box
        p={2}
        borderWidth={1}
        borderRadius="md"
        mb={2}
        alignSelf={isSender ? 'flex-end' : 'flex-start'}
        bg={isSender ? 'blue.100' : 'gray.100'}
      >
        <HStack justify="space-between">
          <HStack>
            <Menu>
              <MenuButton as={IconButton} icon={<HamburgerIcon />} size="sm" variant="ghost" />
              <MenuList>
                <MenuItem onClick={() => setIsAccessModalOpen(true)}>Изменить настройки доступа</MenuItem>
                {(isSender || canDelete) && <MenuItem onClick={handleDelete}>Удалить</MenuItem>}
              </MenuList>
            </Menu>
            <Text fontWeight="bold">{document.senderName}</Text>
            <Text fontWeight="bold">{document.fileName}</Text>
          </HStack>
          <Button as="a" href={`/api/documents/${document.id}/download`} colorScheme="teal" size="sm">
            Скачать
          </Button>
        </HStack>
        <Text>Дата: {new Date(document.uploadedAt).toLocaleString()}</Text>
      </Box>
      <DocumentAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        documentId={document.id}
      />
    </>
  );
}

export default DocumentItem;
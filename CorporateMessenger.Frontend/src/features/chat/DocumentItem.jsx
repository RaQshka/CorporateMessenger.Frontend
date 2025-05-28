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
import { HamburgerIcon, AttachmentIcon } from '@chakra-ui/icons';
import { deleteDocument } from '../../services/api';
import DocumentAccessModal from './DocumentAccessModal';

function DocumentItem({ document, userId, onUpdate, canDeleteAnyDocuments }) {
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const toast = useToast();
  const isSender = document.senderId === userId;
  const canDelete = isSender || canDeleteAnyDocuments;

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
        bg={isSender ? '#27AE60' : '#2C3E50'}
        color="white"
        maxW="60%"
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
      >
        <HStack justify="space-between" align="start">
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              size="sm"
              variant="ghost"
              color="#7F8C8D"
              _hover={{ color: '#3498DB' }}
            />
            <MenuList bg="#FFFFFF" boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)" w="200px">
              <MenuItem onClick={() => setIsAccessModalOpen(true)} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Изменить права по ролям 🔒
              </MenuItem>
              <MenuItem color="#2C3E50" _hover={{ color: '#3498DB' }}>
                Редактировать дату уничтожения ⏰
              </MenuItem>
              {canDelete && (
                <MenuItem onClick={handleDelete} color="#2C3E50" _hover={{ color: '#3498DB' }}>
                  Удалить 🗑️
                </MenuItem>
              )}
            </MenuList>
          </Menu>
          <HStack>
            <AttachmentIcon />
            <Text fontWeight="bold">{document.senderName}</Text>
            <Text fontWeight="bold">{document.fileName}</Text>
          </HStack>
        </HStack>
        <Text fontSize="sm" color="gray.200">
          Дата: {new Date(document.uploadedAt).toLocaleString()}
        </Text>
        <Button as="a" href={`/api/documents/${document.id}/download`} colorScheme="teal" size="sm" mt={2}>
          Скачать
        </Button>
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
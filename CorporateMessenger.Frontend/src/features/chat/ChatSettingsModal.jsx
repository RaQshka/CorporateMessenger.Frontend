import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  Flex,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import {
  getChatParticipants,
  getRoles,
  grantChatAccess,
  removeUserFromChat,
  addUserToChat,
  getChatAccessRules,
} from '../../services/api';
import UserSearchContainer from './UserSearchContainer';

function ChatSettingsModal({ isOpen, onClose, chatId, userId }) {
  const [participants, setParticipants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Маппинг прав доступа
  const PERMISSION_MAP = {
    ReadMessages: { value: 1, label: 'Чтение сообщений' },
    WriteMessages: { value: 4, label: 'Отправка сообщений' },
    DeleteMessage: { value: 8, label: 'Удаление сообщений' },
    AddParticipant: { value: 16, label: 'Добавление участников' },
    RemoveParticipant: { value: 32, label: 'Удаление участников' },
    RenameChat: { value: 64, label: 'Переименование чата' },
    DeleteChat: { value: 128, label: 'Удаление чата' },
    AssignAdmin: { value: 256, label: 'Назначение администратора' },
    ManageAccess: { value: 512, label: 'Управление доступом' },
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [participantsData, rolesData] = await Promise.all([
          getChatParticipants(chatId),
          getRoles(),
        ]);
        setParticipants(participantsData || []);
        setRoles(rolesData || []);

        if (rolesData?.length > 0) {
          const initialRoleId = rolesData[0].roleId || rolesData[0].id;
          setSelectedRole(initialRoleId);
          await loadRolePermissions(initialRoleId);
        }
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        console.error('Fetch data error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen, chatId, toast]);

  const loadRolePermissions = async (roleId) => {
    try {
      const rules = await getChatAccessRules(chatId);
      const roleRule = rules.find((rule) => rule.roleId === roleId);
      const newPermissions = {};

      Object.keys(PERMISSION_MAP).forEach((permKey) => {
        newPermissions[permKey] = roleRule
          ? !!(roleRule.accessMask & PERMISSION_MAP[permKey].value)
          : false;
      });

      setPermissions(newPermissions);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить права роли.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Load permissions error:', err);
    }
  };

  const handleRoleChange = async (e) => {
    const roleId = e.target.value;
    setSelectedRole(roleId);
    await loadRolePermissions(roleId);
  };

  const handlePermissionChange = (permission, isChecked) => {
    setPermissions((prev) => ({ ...prev, [permission]: isChecked }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      toast({
        title: 'Ошибка',
        description: 'Выберите роль.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      const accessMask = Object.entries(permissions).reduce(
        (mask, [key, value]) => {
          if (value) mask |= PERMISSION_MAP[key].value;
          return mask;
        },
        0
      );
      await grantChatAccess(chatId, { roleId: selectedRole, access: accessMask });
      toast({
        title: 'Успех',
        description: 'Права доступа обновлены.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: `Не удалось обновить права доступа: ${err.response?.data?.message || err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Save permissions error:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    setIsLoading(true);
    try {
      await removeUserFromChat(chatId, participantId);
      setParticipants(participants.filter((p) => p.userId !== participantId));
      toast({
        title: 'Успех',
        description: 'Участник удален.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: `Не удалось удалить участника: ${err.response?.data?.message || err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Remove participant error:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (user) => {
    setIsLoading(true);
    try {
      console.log(chatId)
      console.log({ userEmail: user.email })

      await addUserToChat(chatId, { userEmail: user.email });

      toast({
        title: 'Успех',
        description: 'Участник добавлен.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setParticipants([...participants, {
        userId: user.id || user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }]);

    } catch (err) {
      toast({
        title: 'Ошибка',
        description: `Не удалось добавить участника: ${err.response?.data?.message || err}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Add user error:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent maxW="90vw" w="1200px">
        <ModalHeader>Настройки чата</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex>
            <Box w="50%" pr={4}>
              <Heading size="md" mb={4}>Участники</Heading>
              <VStack
                align="start"
                spacing={2}
                maxH="400px"
                overflowY="auto"
                border="1px"
                borderColor="gray.200"
                p={2}
                borderRadius="md"
              >
                {participants.map((participant) => (
                  <HStack key={participant.userId} w="100%" justify="space-between">
                    <Text>{`${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'Без имени'}</Text>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleRemoveParticipant(participant.userId)}
                      isLoading={isLoading}
                      isDisabled={isLoading || participant.userId === userId}
                    >
                      Удалить
                    </Button>
                  </HStack>
                ))}
              </VStack>
              <Box mt={4}>
                <Heading size="sm" mb={2}>Добавить участников</Heading>
                <UserSearchContainer onSelectUser={handleAddUser} />
              </Box>
            </Box>

            <Box w="50%" pl={4}>
              <Heading size="md" mb={4}>Настройка прав доступа</Heading>
              <VStack align="start" spacing={4}>
                <Select
                  placeholder="Выберите роль"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  isDisabled={isLoading}
                >
                  {roles.map((role) => (
                    <option key={role.roleId || role.id} value={role.roleId || role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
                <VStack align="start" spacing={2}>
                  <Text>Права доступа:</Text>
                  {Object.entries(PERMISSION_MAP).map(([key, { label }]) => (
                    <Checkbox
                      key={key}
                      isChecked={permissions[key] || false}
                      onChange={(e) => handlePermissionChange(key, e.target.checked)}
                      isDisabled={isLoading}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </VStack>
                <Button
                  colorScheme="blue"
                  onClick={handleSavePermissions}
                  isLoading={isLoading}
                  isDisabled={isLoading || !selectedRole}
                >
                  Сохранить права
                </Button>
              </VStack>
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} isDisabled={isLoading}>
            Закрыть
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ChatSettingsModal;
import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Checkbox,
  Text,
  useToast,
} from '@chakra-ui/react';
import { getRoles, getDocumentAccessRules, grantDocumentAccess, revokeDocumentAccess } from '../../services/api';

const DOCUMENT_ACCESS_PERMISSIONS = [
  { value: 1, label: 'Просмотр документа' },   // ViewDocument
  { value: 2, label: 'Скачивание документа' }, // DownloadDocument
  { value: 4, label: 'Удаление документа' },   // DeleteDocument
];

function DocumentAccessModal({ isOpen, onClose, documentId }) {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [accessRules, setAccessRules] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Fetch roles and access rules
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, rulesData] = await Promise.all([
          getRoles(),
          getDocumentAccessRules(documentId),
        ]);
        if (Array.isArray(rolesData)) setRoles(rolesData);
        if (Array.isArray(rulesData)) {
          const rulesMap = {};
          rulesData.forEach((rule) => {
            rulesMap[rule.roleId] = rule.accessMask;
          });
          setAccessRules(rulesMap);
        }
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    if (isOpen) fetchData();
  }, [isOpen, documentId, toast]);

  const handlePermissionChange = (permissionValue) => {
    if (!selectedRoleId) return;
    const currentMask = accessRules[selectedRoleId] || 0;
    const newMask = currentMask ^ permissionValue; // Toggle permission
    setAccessRules({ ...accessRules, [selectedRoleId]: newMask });
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите роль',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const currentMask = accessRules[selectedRoleId] || 0;
      const previousMask = (await getDocumentAccessRules(documentId)).find(
        (rule) => rule.roleId === selectedRoleId
      )?.accessMask || 0;

      // Determine permissions to grant or revoke
      for (const perm of DOCUMENT_ACCESS_PERMISSIONS) {
        const isSetNow = (currentMask & perm.value) === perm.value;
        const wasSetBefore = (previousMask & perm.value) === perm.value;

        if (isSetNow && !wasSetBefore) {
          await grantDocumentAccess(documentId, { roleId: selectedRoleId, accessFlag: perm.value });
        } else if (!isSetNow && wasSetBefore) {
          await revokeDocumentAccess(documentId, { roleId: selectedRoleId, accessFlag: perm.value });
        }
      }

      toast({
        title: 'Успех',
        description: 'Правила доступа обновлены',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить правила доступа.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = roles.find((role) => role.roleId === selectedRoleId);
  const currentMask = selectedRoleId ? accessRules[selectedRoleId] || 0 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Настройка доступа к документу</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Выберите роль для просмотра</FormLabel>
              <Select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                placeholder="Выберите роль"
              >
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            {selectedRole && (
              <Box>
                <Text fontWeight="bold" mb={2}>Роль: {selectedRole.name}</Text>
                {DOCUMENT_ACCESS_PERMISSIONS.map((perm) => (
                  <Checkbox
                    key={perm.value}
                    isChecked={(currentMask & perm.value) === perm.value}
                    onChange={() => handlePermissionChange(perm.value)}
                    isDisabled={!selectedRoleId}
                  >
                    {perm.label}
                  </Checkbox>
                ))}
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSave} isLoading={isLoading}>
            Сохранить
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DocumentAccessModal;
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  VStack,
  HStack,
  useToast,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, CheckIcon } from '@chakra-ui/icons';
import { getUsers } from '../../services/api';

function SecureChatUserSelect({ onSelectUser, selectedUser }) {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const inputRef = useRef(null);

  const fetchUsers = async (query) => {
    if (query.length < 2) {
      setUsers([]);
      setError('');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await getUsers(query);
      if (!Array.isArray(data)) throw new Error('Invalid users data format');
      setUsers(data);
    } catch (err) {
      const serverError = err.response?.data.error || 'Не удалось загрузить пользователей';
      setError(serverError);
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.length >= 2) {
        fetchUsers(searchText);
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const handleSelectUser = (user) => {
    const userData = {
      id: user.userId || user.id,
      email: user.email,
      firstName: user.firstName || 'N/A',
      lastName: user.lastName || 'N/A',
    };
    onSelectUser(userData);
    setSearchText('');
    setUsers([]);
    // Восстанавливаем фокус после выбора пользователя
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <Box 
      p={4} 
      bg="white" 
      borderRadius="lg" 
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
      maxW="full"
    >
      <VStack spacing={4} align="stretch">
        {/* Отображение выбранного пользователя */}
        {selectedUser && (
          <Box
            p={3}
            bg="green.50"
            borderRadius="md"
            border="1px solid"
            borderColor="green.200"
          >
            <HStack justify="space-between">
              <Text fontWeight="medium" color="green.700">
                ✓ Выбран: {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <Icon as={CheckIcon} color="green.500" />
            </HStack>
          </Box>
        )}
        
        {/* Поле поиска */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            ref={inputRef}
            placeholder="Поиск по имени или фамилии (мин. 2 символа)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            isDisabled={isLoading}
            bg="white"
            borderColor="gray.300"
            _hover={{ borderColor: 'blue.400' }}
            focusBorderColor="blue.500"
            size="md"
            autoComplete="off"
          />
        </InputGroup>

        {/* Сообщения о состоянии */}
        {error && (
          <Text color="red.500" textAlign="center" fontSize="sm" fontStyle="italic">
            {error}
          </Text>
        )}
        
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="md" color="blue.500" />
            <Text mt={2} color="gray.500" fontSize="sm">Загрузка...</Text>
          </Box>
        ) : users.length === 0 && searchText.length >= 2 ? (
          <Text textAlign="center" color="gray.500" fontSize="sm" py={4}>
            Пользователи не найдены
          </Text>
        ) : users.length === 0 ? (
          <Text textAlign="center" color="gray.400" fontSize="sm" py={4}>
            Введите минимум 2 символа для поиска
          </Text>
        ) : (
          /* Таблица результатов */
          <Box
            maxH="300px"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
          >
            <Table variant="simple" size="sm">
              <Thead bg="gray.50" position="sticky" top={0}>
                <Tr>
                  <Th color="gray.600" fontWeight="semibold">Имя</Th>
                  <Th color="gray.600" fontWeight="semibold">Фамилия</Th>
                  <Th color="gray.600" fontWeight="semibold">Email</Th>
                  <Th color="gray.600" fontWeight="semibold" textAlign="right">Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => {
                  const isSelected = selectedUser?.id === (user.userId || user.id);
                  return (
                    <Tr 
                      key={user.userId || user.id}
                      _hover={{ bg: isSelected ? 'green.50' : 'gray.50' }}
                      bg={isSelected ? 'green.50' : 'white'}
                    >
                      <Td>{user.firstName || 'N/A'}</Td>
                      <Td>{user.lastName || 'N/A'}</Td>
                      <Td color="gray.600">{user.email}</Td>
                      <Td textAlign="right">
                        <Button
                          size="sm"
                          colorScheme={isSelected ? 'green' : 'blue'}
                          onClick={() => handleSelectUser(user)}
                          _hover={{ 
                            transform: isSelected ? 'none' : 'scale(1.05)',
                            shadow: isSelected ? 'none' : 'md'
                          }}
                          transition="all 0.2s"
                          disabled={isSelected}
                        >
                          {isSelected ? 'Выбрано' : 'Выбрать'}
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default SecureChatUserSelect;
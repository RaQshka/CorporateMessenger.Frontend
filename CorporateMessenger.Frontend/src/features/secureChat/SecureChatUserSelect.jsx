import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
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
      fetchUsers(searchText);
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
    inputRef.current?.focus();
  };

  return (
    <Box p={4} bg="white" borderRadius="md" boxShadow="md" maxW="lg" color="light">
      <VStack spacing={4}>
        {selectedUser && (
          <Text color="black">
            Выбран: {selectedUser.firstName} {selectedUser.lastName}
          </Text>
        )}
        <Input
          ref={inputRef}
          placeholder="Поиск по имени или фамилии (мин. 2 символа)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          isDisabled={isLoading}
          bg="lignt"
          borderColor="white"
          _hover={{ borderColor: 'gray.500' }}
          focusBorderColor="blue.500"
        />
        {error && <Text color="red.400" textAlign="center">{error}</Text>}
        {isLoading ? (
          <Text textAlign="center">Загрузка...</Text>
        ) : users.length === 0 && searchText.length >= 2 ? (
          <Text textAlign="center">Пользователи не найдены</Text>
        ) : users.length === 0 ? (
          <Text textAlign="center">Введите запрос для поиска</Text>
        ) : (
          <Table variant="simple" size="sm">
            <Thead bg="white">
              <Tr>
                <Th color="black">Имя</Th>
                <Th color="black">Фамилия</Th>
                <Th color="black">Email</Th>
                <Th color="black">Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.userId || user.id}>
                  <Td>{user.firstName || 'N/A'}</Td>
                  <Td>{user.lastName || 'N/A'}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleSelectUser(user)}
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                      
                      bg="blue.600"
                      _disabled={{ bg: 'gray.600', cursor: 'not-allowed' }}
                    >
                      {selectedUser?.id === (user.userId || user.id) ? 'Выбрано' : 'Выбрать'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>
    </Box>
  );
}

export default SecureChatUserSelect;
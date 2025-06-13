import { useState, useEffect } from 'react';
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

function UserSearchContainer({ onSelectUser }) {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const fetchUsers = async (query) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getUsers(query); // Передаем строку напрямую
      if (!Array.isArray(data)) throw new Error('Invalid users data format');
      setUsers(data);
    } catch (err) {
      const serverError = err.response?.data?.message || 'Не удалось загрузить пользователей';
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
      if (searchText) fetchUsers(searchText);
      else setUsers([]);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const handleSelectUser = (user) => {
    if (onSelectUser) {
      onSelectUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  };

  return (
    <Box p={4}  borderRadius="md" boxShadow="md" maxW="lg" mx="auto">
      <VStack spacing={4}>
        <Input
          placeholder="Поиск по имени или фамилии..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          isDisabled={isLoading}
          borderColor="blue.200"
          _hover={{ borderColor: 'blue.300' }}
          focusBorderColor="blue.500"
        />
        {error && <Text color="red.500" textAlign="center">{error}</Text>}
        {isLoading ? (
          <Text textAlign="center">Загрузка...</Text>
        ) : users.length === 0 ? (
          <Text textAlign="center">Пользователи не найдены</Text>
        ) : (
          <Table variant="simple" size="sm">
            <Thead bg="blue.50">
              <Tr>
                <Th>Имя</Th>
                <Th>Фамилия</Th>
                <Th>Email</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.email}>
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
                      isDisabled={isLoading}
                    >
                      Добавить
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

export default UserSearchContainer;
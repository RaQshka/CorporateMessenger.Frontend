import { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, Button, useToast, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { getUnconfirmedUsers, confirmAccount, deleteUser } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Admin() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUnconfirmedUsers();
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          throw new Error('Неверный формат данных');
        }
      } catch (err) {
        setError('Не удалось загрузить пользователей');
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список пользователей.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const handleConfirm = async (userId) => {
    try {
      await confirmAccount({ userId });
      setUsers(users.filter((u) => u.userId !== userId));
      toast({
        title: 'Успех',
        description: 'Аккаунт подтвержден',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить аккаунт.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser({ userId });
      setUsers(users.filter((u) => u.userId !== userId));
      toast({
        title: 'Успех',
        description: 'Пользователь удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пользователя.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={6}>
        <Heading as="h2" mb={4}>Администрирование</Heading>
        <Text mb={4}>Неподтвержденные пользователи:</Text>
        {isLoading ? (
          <Text>Загрузка...</Text>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : users.length === 0 ? (
          <Text>Нет неподтвержденных пользователей</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Имя</Th>
                <Th>Email</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.userId}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Button colorScheme="green" size="sm" mr={2} onClick={() => handleConfirm(user.userId)}>
                      Подтвердить
                    </Button>
                    <Button colorScheme="red" size="sm" onClick={() => handleDelete(user.userId)}>
                      Удалить
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
      <Footer />
    </Box>
  );
}

export default Admin;
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Input,
  Select,
  HStack,
} from '@chakra-ui/react';
import { getUnconfirmedUsers, confirmAccount, deleteUser, getUsers, exportUserAuditLogs } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Admin() {
  const [users, setUsers] = useState([]); // Неподтвержденные пользователи
  const [allUsers, setAllUsers] = useState([]); // Все пользователи для экспорта логов
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(''); // Для экспорта логов
  const [days, setDays] = useState(''); // Количество дней для экспорта логов
  const toast = useToast();

  // Загрузка неподтвержденных пользователей
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

    // Загрузка всех пользователей для выпадающего списка
    const fetchAllUsers = async () => {
      try {
        const data = await getUsers();
        if (Array.isArray(data)) {
          setAllUsers(data);
        } else {
          throw new Error('Неверный формат данных');
        }
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список всех пользователей.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchUsers();
    fetchAllUsers();
  }, [toast]);

  // Подтверждение аккаунта
  const handleConfirm = async (userId) => {
    try {
      await confirmAccount({ userId });
      setUsers(users.filter((u) => u.id !== userId));
      toast({
        title: 'Успех',
        description: 'Аккаунт подтвержден',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const serverError = err.response?.data?.message || 'Не удалось подтвердить аккаунт';
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Удаление аккаунта
  const handleDelete = async (userId) => {
    try {
      await deleteUser({ userId });
      setUsers(users.filter((u) => u.id !== userId));
      toast({
        title: 'Успех',
        description: 'Пользователь удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const serverError = err.response?.data?.message || 'Не удалось удалить пользователя';
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Экспорт логов
  const handleExportLogs = async () => {
    if (!selectedUserId || !days) {
      toast({
        title: 'Ошибка',
        description: 'Выберите пользователя и укажите количество дней',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const blob = await exportUserAuditLogs(selectedUserId, days);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_logs_${selectedUserId}_${days}_days.csv`); // Имя файла
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: 'Успех',
        description: 'Логи успешно экспортированы',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const serverError = err.response?.data?.message || 'Не удалось экспортировать логи';
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="gray.50">
      <Header />
      <Box flex="1" p={6} maxW="lg" mx="auto">
        <Heading as="h2" mb={4} color="blue.600">Администрирование</Heading>

        {/* Секция неподтвержденных пользователей */}
        <Text mb={4} fontSize="lg">Неподтвержденные пользователи:</Text>
        {isLoading ? (
          <Text textAlign="center">Загрузка...</Text>
        ) : error ? (
          <Text color="red.500" textAlign="center">{error}</Text>
        ) : users.length === 0 ? (
          <Text textAlign="center">Нет неподтвержденных пользователей</Text>
        ) : (
          <Table variant="simple" bg="white" borderRadius="md" boxShadow="md">
            <Thead bg="blue.50">
              <Tr>
                <Th>Имя</Th>
                <Th>Email</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Button
                      colorScheme="green"
                      size="sm"
                      mr={2}
                      onClick={() => handleConfirm(user.id)}
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      Подтвердить
                    </Button>
                    <Button
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      Удалить
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {/* Секция экспорта логов */}
        <Box mt={8} p={4} bg="white" borderRadius="md" boxShadow="md">
          <Text mb={4} fontSize="lg">Экспорт логов пользователя:</Text>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Выберите пользователя</FormLabel>
              <Select
                placeholder="Выберите пользователя"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                borderColor="blue.200"
                _hover={{ borderColor: 'blue.300' }}
                focusBorderColor="blue.500"
              >
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} {user.email}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Количество дней</FormLabel>
              <Input
                type="number"
                placeholder="Введите количество дней"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                borderColor="blue.200"
                _hover={{ borderColor: 'blue.300' }}
                focusBorderColor="blue.500"
              />
            </FormControl>
            <Button
              colorScheme="blue"
              onClick={handleExportLogs}
              _hover={{ transform: 'scale(1.05)' }}
              transition="all 0.2s"
            >
              Экспортировать логи
            </Button>
          </VStack>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

export default Admin;
import { useState, useEffect, useRef } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Button, 
  Select, useToast, Tag, TagLabel, TagCloseButton,
  Table, Thead, Tbody, Tr, Th, Td, Spinner,
  FormControl, FormLabel, Input, Stack, Badge
} from '@chakra-ui/react';
import { 
  getUsers, getRoles, assignRole, removeRole, 
  deleteUser, getUnconfirmedUsers, confirmAccount,
  exportUserAuditLogs
} from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [unconfirmedUsers, setUnconfirmedUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [days, setDays] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const toast = useToast();
  const logsSectionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, rolesData, unconfirmedData] = await Promise.all([
          getUsers(),
          getRoles(),
          getUnconfirmedUsers()
        ]);
        setUsers(usersData);
        setRoles(rolesData);
        setUnconfirmedUsers(unconfirmedData);
      } catch (err) {
        const serverError = err.response?.data.error || 'Ошибка загрузки данных';
        setError(serverError);
        toast({
          title: 'Ошибка',
          description: serverError,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleRoleChange = async (userId, roleName, action) => {
    try {
      const command = { UserId: userId, RoleName: roleName };
      
      if (action === 'add') {
        await assignRole(command);
        toast({
          title: 'Роль добавлена',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await removeRole(command);
        toast({
          title: 'Роль удалена',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      const serverError = err.response?.data.error || 'Ошибка изменения роли';
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        await deleteUser({ UserId: userId });
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: 'Пользователь удален',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        const serverError = err.response?.data.error || 'Ошибка удаления пользователя';
        toast({
          title: 'Ошибка',
          description: serverError,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleConfirmUser = async (userId) => {
    try {
      await confirmAccount({ userId });
      setUnconfirmedUsers(unconfirmedUsers.filter(user => user.id !== userId));
      toast({
        title: 'Пользователь подтвержден',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      const serverError = err.response?.data.error || 'Ошибка подтверждения пользователя';
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewLogs = (userId) => {
    setSelectedUserId(userId);
    logsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExportLogs = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите пользователя',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const blob = await exportUserAuditLogs(
        selectedUserId, 
        days ? parseInt(days) : null,
        startTime ? new Date(startTime) : null,
        endDate ? new Date(endDate) : null
      );
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${selectedUserId}_${new Date().toISOString()}.csv`);
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
      const serverError = err.response?.data.error || 'Не удалось экспортировать логи';
      toast({
        title: 'Ошибка',
        description: serverError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) return (
    <Box textAlign="center" mt={10}>
      <Spinner size="xl" />
    </Box>
  );

  if (error) return <Text color="red.500" textAlign="center">{error}</Text>;

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="gray.50">
      <Header />
      
      <Box flex="1" p={6} maxW="6xl" mx="auto" mt={10}>
        <Heading as="h2" mb={6} color="blue.600">Панель администратора</Heading>
        
        {/* Секция неподтвержденных пользователей */}
        <Box mb={10}>
          <Heading as="h3" size="md" mb={4}>Неподтвержденные пользователи</Heading>
          
          {unconfirmedUsers.length === 0 ? (
            <Text fontSize="md" color="gray.500" py={4}>
              Нет неподтвержденных пользователей
            </Text>
          ) : (
            <Table variant="simple" bg="white" borderRadius="lg" boxShadow="md">
              <Thead bg="blue.50">
                <Tr>
                  <Th>Имя</Th>
                  <Th>Email</Th>
                  <Th>Статус</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {unconfirmedUsers.map(user => (
                  <Tr key={user.id}>
                    <Td>{user.firstName} {user.lastName}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Tag colorScheme="orange" size="sm">
                        Ожидает подтверждения
                      </Tag>
                    </Td>
                    <Td>
                      <HStack spacing={3}>
                        <Button 
                          colorScheme="green" 
                          size="sm"
                          onClick={() => handleConfirmUser(user.id)}
                        >
                          Подтвердить
                        </Button>
                        <Button 
                          colorScheme="red" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Удалить
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        {/* Секция всех пользователей */}
        <Box mb={10}>
          <Heading as="h3" size="md" mb={4}>Все пользователи</Heading>
          <Table variant="simple" bg="white" borderRadius="lg" boxShadow="md">
            <Thead bg="blue.50">
              <Tr>
                <Th>ID</Th>
                <Th>Имя</Th>
                <Th>Email</Th>
                <Th>Статус</Th>
                <Th>Роли</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(user => (
                <Tr key={user.id}>
                  <Td>{user.id}</Td>
                  <Td>{user.firstName} {user.lastName}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Stack direction="row" spacing={2}>
                      <Badge 
                        colorScheme={user.emailConfirmed ? 'green' : 'orange'} 
                        px={2} py={1} borderRadius="md"
                      >
                        {user.emailConfirmed ? 'Email подтвержден' : 'Email не подтвержден'}
                      </Badge>
                      <Badge 
                        colorScheme={user.registrationStatus === 'Confirmed' ? 'green' : 'orange'} 
                        px={2} py={1} borderRadius="md"
                      >
                        {user.registrationStatus === 'Confirmed' ? 'Аккаунт подтвержден' : 'Аккаунт не подтвержден'}
                      </Badge>
                    </Stack>
                  </Td>
                  <Td>
                    <HStack spacing={2} wrap="wrap">
                      {user.roles?.map(role => (
                        <Tag key={role} size="sm" variant="solid" colorScheme="blue">
                          <TagLabel>{role}</TagLabel>
                          <TagCloseButton 
                            onClick={() => handleRoleChange(user.id, role, 'remove')} 
                          />
                        </Tag>
                      ))}
                      
                      <Select
                        value=""
                        size="sm"
                        w="150px"
                        onChange={(e) => 
                          e.target.value && handleRoleChange(user.id, e.target.value, 'add')
                        }
                        placeholder="Добавить роль"
                      >
                        {roles
                          .filter(role => !user.roles?.includes(role.name))
                          .map(role => (
                            <option key={role.id} value={role.name}>
                              {role.name}
                            </option>
                          ))}
                      </Select>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack spacing={3}>
                      <Button 
                        colorScheme="teal" 
                        size="sm"
                        onClick={() => handleViewLogs(user.id)}
                      >
                        Логи
                      </Button>
                      <Button 
                        colorScheme="red" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Удалить
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Секция экспорта логов */}
        <Box ref={logsSectionRef} p={6} bg="white" borderRadius="lg" boxShadow="md" mb={10}>
          <Heading as="h3" size="md" mb={4}>Экспорт логов пользователя</Heading>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>ID пользователя</FormLabel>
              <Input
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Введите UUID пользователя"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Количество дней (опционально)</FormLabel>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="30"
              />
            </FormControl>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Начальная дата (опционально)</FormLabel>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Конечная дата (опционально)</FormLabel>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormControl>
            </HStack>
            
            <Text fontSize="sm" color="gray.500">
              Если указаны дни, фильтр по датам игнорируется
            </Text>
            
            <Button 
              colorScheme="blue" 
              onClick={handleExportLogs}
              mt={4}
              alignSelf="flex-start"
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

export default AdminPanel;
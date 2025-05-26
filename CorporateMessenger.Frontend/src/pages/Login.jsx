import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, Heading, useToast } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { loginUser } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await loginUser({ username, password });
      if (response.token) {
        localStorage.setItem('token', response.token);
        toast({
          title: 'Успех',
          description: 'Вы успешно вошли',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        setError(response.message || 'Ошибка входа');
        toast({
          title: 'Ошибка',
          description: response.message || 'Не удалось войти.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти. Проверьте данные и попробуйте снова.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg">
        <VStack spacing={4}>
          <Heading as="h2" size="lg">Вход</Heading>
          {error && <Text color="red.500">{error}</Text>}
          <FormControl isRequired>
            <FormLabel>Имя пользователя</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              isDisabled={isLoading}
              placeholder="Введите имя пользователя"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Пароль</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isDisabled={isLoading}
              placeholder="Введите пароль"
            />
          </FormControl>
          <Button
            colorScheme="blue"
            onClick={handleLogin}
            width="full"
            isLoading={isLoading}
            loadingText="Вход..."
          >
            Войти
          </Button>
          <Text>
            Нет аккаунта?{' '}
            <Text as={RouterLink} to="/register" color="blue.500">
              Зарегистрироваться
            </Text>
          </Text>
        </VStack>
      </Box>
      <Footer />
    </Box>
  );
}

export default Login;
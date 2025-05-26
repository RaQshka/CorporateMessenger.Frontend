import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, Heading, useToast } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { registerUser } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [corporateKey, setCorporateKey] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !corporateKey.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Некорректный email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (corporateKey.length < 4) {
      setError('Корпоративный ключ должен содержать минимум 4 символа');
      return;
    }
    if (firstName.length < 2) {
      setError('Имя должно содержать минимум 2 символа');
      return;
    }
    if (lastName.length < 2) {
      setError('Фамилия должна содержать минимум 2 символа');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await registerUser({
        username,
        email,
        password,
        corporateKey,
        firstName,
        lastName,
      });
      if (response.userId) {
        toast({
          title: 'Успех',
          description: 'Регистрация прошла успешно. Пожалуйста, войдите.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      } else {
        setError(response.message || 'Ошибка регистрации');
        toast({
          title: 'Ошибка',
          description: response.message || 'Не удалось зарегистрироваться.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации');
      toast({
        title: 'Ошибка',
        description: 'Не удалось зарегистрироваться. Попробуйте позже.',
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
          <Heading as="h2" size="lg">Регистрация</Heading>
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
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isDisabled={isLoading}
              placeholder="Введите email"
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
          <FormControl isRequired>
            <FormLabel>Корпоративный ключ</FormLabel>
            <Input
              value={corporateKey}
              onChange={(e) => setCorporateKey(e.target.value)}
              isDisabled={isLoading}
              placeholder="Введите корпоративный ключ"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Имя</FormLabel>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              isDisabled={isLoading}
              placeholder="Введите имя"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Фамилия</FormLabel>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              isDisabled={isLoading}
              placeholder="Введите фамилию"
            />
          </FormControl>
          <Button
            colorScheme="blue"
            onClick={handleRegister}
            width="full"
            isLoading={isLoading}
            loadingText="Регистрация..."
          >
            Зарегистрироваться
          </Button>
          <Text>
            Уже есть аккаунт?{' '}
            <Text as={RouterLink} to="/login" color="blue.500">
              Войти
            </Text>
          </Text>
        </VStack>
      </Box>
      <Footer />
    </Box>
  );
}

export default Register;
import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await login(username, password);
      if (response.token) {
        localStorage.setItem('token', response.token);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Ошибка входа');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg" className="shadow-lg">
      <VStack spacing={4}>
        {error && <Text color="red.500">{error}</Text>}
        <FormControl isRequired>
          <FormLabel>Имя пользователя</FormLabel>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Пароль</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        <Button colorScheme="blue" onClick={handleLogin} width="full" className="hover:bg-blue-600">
          Войти
        </Button>
      </VStack>
    </Box>
  );
}
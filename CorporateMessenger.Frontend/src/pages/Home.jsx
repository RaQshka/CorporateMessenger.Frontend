import { useEffect, useState } from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProfile } from '../services/api';

function Home() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then(() => {
          // Если профиль получен успешно, перенаправляем на dashboard
          navigate('/dashboard');
        })
        .catch(() => {
          // Если токен невалиден, удаляем его и остаемся на странице
          localStorage.removeItem('token');
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, [navigate]);

  // Показываем пустой экран во время проверки токена
  if (isChecking) {
    return null;
  }

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={6} textAlign="center">
        <Heading as="h1" mb={4}>Добро пожаловать в корпоративный мессенджер!</Heading>
        <Text mb={6}>Общайтесь, делитесь документами и управляйте чатами в одном месте.</Text>
        <Button as={RouterLink} to="/login" colorScheme="blue" mr={4}>
          Войти
        </Button>
        <Button as={RouterLink} to="/register" colorScheme="teal">
          Зарегистрироваться
        </Button>
      </Box>
      <Footer />
    </Box>
  );
}

export default Home;
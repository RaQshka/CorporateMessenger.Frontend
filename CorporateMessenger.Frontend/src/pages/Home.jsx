import { useEffect } from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

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
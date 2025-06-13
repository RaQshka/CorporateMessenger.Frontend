import { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { getProfile } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function Profile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        const serverError = err.response?.data?.message || 'Не удалось загрузить профиль';
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
    fetchProfile();
  }, [toast]);

  if (isLoading) return <Text textAlign="center">Загрузка...</Text>;
  if (error) return <Text color="red.500" textAlign="center">{error}</Text>;

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="gray.50">
      <Header />
      <Box flex="1" p={6} maxW="md" mx="auto" mt={10} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading as="h2" mb={4} color="blue.600">Профиль пользователя</Heading>
        <VStack spacing={4} align="start">
          <Text><strong>Имя:</strong> {profile.name}</Text>
          <Text><strong>Email:</strong> {profile.email}</Text>
          <Text><strong>ID:</strong> {profile.userId}</Text>
        </VStack>
      </Box>
      <Footer />
    </Box>
  );
}

export default Profile;
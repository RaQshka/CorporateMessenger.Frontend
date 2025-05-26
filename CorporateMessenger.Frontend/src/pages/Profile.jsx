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
        setError('Не удалось загрузить профиль');
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные профиля.',
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

  if (isLoading) return <Text>Загрузка...</Text>;
  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={6}>
        <Heading as="h2" mb={4}>Профиль пользователя</Heading>
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
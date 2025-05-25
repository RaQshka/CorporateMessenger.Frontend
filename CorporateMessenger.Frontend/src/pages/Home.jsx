import { Box, Heading, Text } from '@chakra-ui/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function Home() {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={6} textAlign="center">
        <Heading as="h1" mb={4}>Добро пожаловать в корпоративный мессенджер!</Heading>
        <Text>Общайтесь, делитесь документами и управляйте чатами в одном месте.</Text>
      </Box>
      <Footer />
    </Box>
  );
}

export default Home;
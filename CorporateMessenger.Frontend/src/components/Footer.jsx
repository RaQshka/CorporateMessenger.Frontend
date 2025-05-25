import { Box, Text } from '@chakra-ui/react';

function Footer() {
  return (
    <Box bg="gray.100" py={4} textAlign="center">
      <Text>&copy; {new Date().getFullYear()} Корпоративный мессенджер. Все права защищены.</Text>
    </Box>
  );
}

export default Footer;
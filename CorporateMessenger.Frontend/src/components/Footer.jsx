import { Box, Text } from '@chakra-ui/react';

function Footer() {
  return (
    <Box bg="gray.800" color="white" py={4} textAlign="center">
      <Text>© {new Date().getFullYear()} Корпоративный мессенджер. Все права защищены.</Text>
    </Box>
  );
}

export default Footer;
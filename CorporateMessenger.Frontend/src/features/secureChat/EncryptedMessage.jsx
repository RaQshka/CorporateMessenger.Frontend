import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { EncryptionService } from './EncryptionService';

function EncryptedMessage({ activity, aesKey, userId }) {
  const [decryptedText, setDecryptedText] = useState('[Decrypting...]');

  useEffect(() => {
    decryptMessage();
  }, [activity, aesKey]);

  const decryptMessage = async () => {
    try {
      const text = await EncryptionService.decryptData(aesKey, activity.data.encryptedData, activity.data.iv);
      setDecryptedText(text);
    } catch (error) {
      console.error('Error decrypting message:', error);
      setDecryptedText('[Decryption Error]');
    }
  };

  const isOwn = activity.data.sender.id === userId;

  return (
    <Box
      bg={isOwn ? 'blue.100' : 'gray.100'}
      p={3}
      borderRadius="md"
      maxW="80%"
      alignSelf={isOwn ? 'flex-end' : 'flex-start'}
    >
      <Text>{decryptedText}</Text>
      <Text fontSize="xs" color="gray.500">
        {new Date(activity.timestamp).toLocaleTimeString()} - {activity.data.sender.firstName} {activity.data.sender.lastName}
      </Text>
    </Box>
  );
}

export default EncryptedMessage;
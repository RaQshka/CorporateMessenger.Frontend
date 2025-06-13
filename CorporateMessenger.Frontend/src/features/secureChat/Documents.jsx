import { useState, useEffect } from 'react';
import { Box, Text, Link, Icon, HStack } from '@chakra-ui/react';
import { EncryptionService } from '../services/EncryptionService';
import { FaFile } from 'react-icons/fa';

function Document({ activity, aesKey, userId }) {
  const [decryptedFile, setDecryptedFile] = useState(null);

  useEffect(() => {
    decryptDocument();
  }, [activity, aesKey]);

  const decryptDocument = async () => {
    try {
      const file = await EncryptionService.decryptData(aesKey, activity.data.encryptedData, activity.data.iv);
      setDecryptedFile(file);
    } catch (error) {
      console.error('Error decrypting document:', error);
    }
  };

  const handleDownload = () => {
    if (decryptedFile) {
      const blob = new Blob([decryptedFile], { type: activity.data.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activity.data.fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Box
      p={3}
      borderWidth={1}
      borderRadius="md"
      maxW="80%"
      alignSelf={activity.data.uploaderId === userId ? 'flex-end' : 'flex-start'}
    >
      <HStack>
        <Icon as={FaFile} />
        <Text>{activity.data.fileName}</Text>
      </HStack>
      <Text fontSize="sm">Type: {activity.data.fileType}</Text>
      <Text fontSize="sm">Size: {activity.data.fileSize} bytes</Text>
      <Link onClick={handleDownload} color="blue.500">Download</Link>
      <Text fontSize="xs" color="gray.500">
        {new Date(activity.timestamp).toLocaleTimeString()} - {activity.data.sender.firstName} {activity.data.sender.lastName}
      </Text>
    </Box>
  );
}

export default Document;
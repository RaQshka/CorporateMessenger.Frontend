import { useState, useEffect } from 'react';
import { Box, Text, Link, Icon, HStack } from '@chakra-ui/react';
import { EncryptionService } from './EncryptionService';
import { FaFile } from 'react-icons/fa';

function EncryptedDocument({ activity, aesKey, userId }) {
  const [decryptedUrl, setDecryptedUrl] = useState(null);

  useEffect(() => {
    const decryptDocument = async () => {
      try {
        const response = await downloadDocument(activity.id);
        const decrypted = await EncryptionService.decryptData(
          aesKey, 
          response.fileData,
          activity.iv
        );
        
        const blob = new Blob([decrypted], { type: activity.fileType });
        setDecryptedUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error('Ошибка расшифровки документа:', error);
      }
    };
    
    decryptDocument();
  }, [activity, aesKey]);

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
      {decryptedUrl && (
        <Link 
          href={decryptedUrl} 
          download={activity.fileName}
          color="blue.500"
        >
          Скачать
        </Link>
      )}
    </Box>
  );
}

export default EncryptedDocument;
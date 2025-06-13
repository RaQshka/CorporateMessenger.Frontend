import { Box, Text, Link } from '@chakra-ui/react';
import { decryptData, decryptFile } from './EncryptionService';

function MessageComponent({ activity, aesKey, userId }) {
  const isMessage = activity.type === 'Message';
  const data = activity.data;
  const isOwn = data.sender?.id === userId || data.uploaderId === userId;

  let content;
  if (isMessage) {
    content = decryptData(
      {
        ciphertext: data.ciphertext,
        iv: data.iv,
        tag: data.tag,
      },
      aesKey
    );
  } else {
    content = data.fileName;
  }

  const handleDownload = async () => {
    if (!isMessage) {
      try {
        const blob = await decryptFile(
          {
            ciphertext: data.fileData,
            iv: data.iv,
            tag: data.tag,
          },
          aesKey,
          data.fileType
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Не удалось расшифровать файл');
      }
    }
  };

  return (
    <Box
      bg={isOwn ? 'blue.700' : 'gray.700'}
      p={3}
      borderRadius="md"
      mb={2}
      maxW="80%"
      alignSelf={isOwn ? 'flex-end' : 'flex-start'}
    >
      {isMessage ? (
        <Text>{content}</Text>
      ) : (
        <Link onClick={handleDownload} color="blue.300">
          {content}
        </Link>
      )}
      <Text fontSize="xs" color="gray.400" mt={1}>
        {new Date(activity.timestamp).toLocaleTimeString()}
      </Text>
    </Box>
  );
}

export default MessageComponent;
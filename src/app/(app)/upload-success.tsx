import { useLocalSearchParams } from 'expo-router';
import { UploadSuccessScreen } from '@/features/driver/upload-success-screen';

export default function UploadSuccessRoute() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  return <UploadSuccessScreen photoUri={uri} />;
}

import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { ChevronLeft } from '@/components/ui/icons';

type RiveBackButtonProps = {
  onPress?: () => void;
  size?: number;
  testID?: string;
  accessibilityLabel?: string;
  stateMachineName?: string;
  triggerInputName?: string;
};

export function RiveBackButton({
  onPress,
  size = 34,
  testID,
  accessibilityLabel = 'Go back',
}: RiveBackButtonProps) {
  const router = useRouter();
  const [pressed, setPressed] = React.useState(false);

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.back();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e5e5',
      }}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.76 : 1,
          translateX: pressed ? -5 : 0,
          rotateZ: pressed ? '-12deg' : '0deg',
          opacity: pressed ? 0.85 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 11,
          mass: 0.55,
          stiffness: 320,
        }}
      >
        <ChevronLeft color="#525252" width={18} height={18} />
      </MotiView>
    </TouchableOpacity>
  );
}

import { useForm } from '@tanstack/react-form';

import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { Button, Input, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  onSubmit?: (data: FormType) => void;
  error?: string | null;
};

export function LoginForm({ onSubmit = () => {}, error }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-6">
        <View className="mb-8 items-center justify-center">
          <View className="bg-primary mb-4 size-16 items-center justify-center rounded-2xl">
            <Text className="text-xl font-bold text-white">AD</Text>
          </View>
          <Text testID="form-title" className="pb-2 text-center text-3xl font-bold">
            AdTruck Driver
          </Text>
          <Text className="text-center text-gray-500">
            Sign in with your driver credentials
          </Text>
        </View>

        <form.Field
          name="username"
          children={field => (
            <Input
              testID="username-input"
              label="Username"
              autoCapitalize="none"
              autoCorrect={false}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Field
          name="password"
          children={field => (
            <Input
              testID="password-input"
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        {error
          ? (
              <Text className="mb-2 text-center text-sm text-red-500">{error}</Text>
            )
          : null}

        <form.Subscribe
          selector={state => state.isSubmitting}
          children={isSubmitting => (
            <Button
              testID="login-button"
              label="Sign In"
              onPress={form.handleSubmit}
              loading={isSubmitting}
            />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { LaunchArguments } from 'react-native-launch-arguments';
import { z } from 'zod';

import { Button, Input, Text, View } from '@/components/ui';

export type FormType = {
  username: string;
  password: string;
};

export type LoginFormProps = {
  onSubmit?: (data: FormType) => void;
  error?: string | null;
};

// secureTextEntry blocks XCTest from firing onChangeText via the UIKit delegate
// path (Maestro issue #1061). When launched with isE2E="true" via launchApp
// arguments, disable secure entry so Maestro can type the password normally.
// In all other builds (including dev) the field is always secure.
const isE2E = LaunchArguments.value<{ isE2E?: string }>().isE2E === 'true';

const usernameSchema = z.string().min(1, 'Username is required');
const passwordSchema = z.string().min(1, 'Password is required');

export function LoginForm({ onSubmit = () => {}, error }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
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
          validators={{
            onChange: usernameSchema,
          }}
        >
          {field => (
            <Input
              testID="username-input"
              label="Username"
              autoCapitalize="none"
              autoCorrect={false}
              value={field.state.value}
              onChangeText={text => field.handleChange(text)}
              onBlur={field.handleBlur}
              error={field.state.meta.errors.length > 0 ? String((field.state.meta.errors[0] as any)?.message ?? field.state.meta.errors[0]) : undefined}
            />
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: passwordSchema,
          }}
        >
          {field => (
            <Input
              testID="password-input"
              label="Password"
              placeholder="••••••••"
              secureTextEntry={!isE2E}
              value={field.state.value}
              onChangeText={text => field.handleChange(text)}
              onBlur={field.handleBlur}
              error={field.state.meta.errors.length > 0 ? String((field.state.meta.errors[0] as any)?.message ?? field.state.meta.errors[0]) : undefined}
            />
          )}
        </form.Field>

        {error
          ? (
              <Text className="mb-2 text-center text-sm text-red-500">{error}</Text>
            )
          : null}

        <form.Subscribe selector={state => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button
              testID="login-button"
              label="Sign In"
              onPress={form.handleSubmit}
              loading={isSubmitting}
            />
          )}
        </form.Subscribe>
      </View>
    </KeyboardAvoidingView>
  );
}

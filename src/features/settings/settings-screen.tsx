import Env from 'env';
import { useState } from 'react';
import { useUniwind } from 'uniwind';

import {
  colors,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { Github, Rate, Share, Support, Website } from '@/components/ui/icons';
import { DeleteAccountConfirmDialog } from '@/features/auth/components/delete-account-confirm-dialog';
import { LogoutConfirmDialog } from '@/features/auth/components/logout-confirm-dialog';
import { useAccountDeletion } from '@/features/auth/use-account-deletion';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

export function SettingsScreen() {
  const signOut = useAuth.use.signOut();
  const profile = useAuth.use.profile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const accountDeletion = useAccountDeletion();
  const { theme } = useUniwind();
  const canDeleteAccount = profile?.role !== 'admin';
  const iconColor
    = theme === 'dark' ? colors.neutral[400] : colors.neutral[500];
  return (
    <>
      <FocusAwareStatusBar />

      <ScrollView>
        <View className="flex-1 px-4 pt-16">
          <Text className="text-xl font-bold">
            {translate('settings.title')}
          </Text>
          <SettingsContainer title="settings.generale">
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SettingsContainer title="settings.about">
            <SettingsItem
              text="settings.app_name"
              value={Env.EXPO_PUBLIC_NAME}
            />
            <SettingsItem
              text="settings.version"
              value={Env.EXPO_PUBLIC_VERSION}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.support_us">
            <SettingsItem
              text="settings.share"
              icon={<Share color={iconColor} />}
              onPress={() => {}}
            />
            <SettingsItem
              text="settings.rate"
              icon={<Rate color={iconColor} />}
              onPress={() => {}}
            />
            <SettingsItem
              text="settings.support"
              icon={<Support color={iconColor} />}
              onPress={() => {}}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.links">
            <SettingsItem text="settings.privacy" onPress={() => {}} />
            <SettingsItem text="settings.terms" onPress={() => {}} />
            <SettingsItem
              text="settings.github"
              icon={<Github color={iconColor} />}
              onPress={() => {}}
            />
            <SettingsItem
              text="settings.website"
              icon={<Website color={iconColor} />}
              onPress={() => {}}
            />
          </SettingsContainer>

          <View className="my-8">
            <SettingsContainer>
              <SettingsItem
                text="settings.logout"
                onPress={() => setConfirmOpen(true)}
              />
            </SettingsContainer>
          </View>
          {canDeleteAccount && (
            <View className="mb-12">
              <SettingsContainer title="settings.account">
                <SettingsItem
                  text="settings.delete_account.label"
                  onPress={accountDeletion.startDeletion}
                />
              </SettingsContainer>
            </View>
          )}
        </View>
      </ScrollView>
      <LogoutConfirmDialog
        visible={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          signOut();
        }}
      />
      <DeleteAccountConfirmDialog
        key={accountDeletion.open ? 'delete-open' : 'delete-closed'}
        visible={accountDeletion.open}
        loading={accountDeletion.loading}
        errorMessage={accountDeletion.errorMessage}
        onCancel={accountDeletion.cancel}
        onConfirm={accountDeletion.confirm}
      />
    </>
  );
}

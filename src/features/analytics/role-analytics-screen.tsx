import type { BarDatum } from '@/components/ui/horizontal-bar-chart';
import type { AnalyticsRange } from '@/lib/analytics';

import * as React from 'react';
import { Pressable, View as RNView, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, ListPaginationAnimation, lottieAssets } from '@/components/motion';
import { RiveBackButton, Text, View } from '@/components/ui';
import { HorizontalBarChart } from '@/components/ui/horizontal-bar-chart';
import { Share as ShareIcon } from '@/components/ui/icons';
import { useModal } from '@/components/ui/modal';
import { Options } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { storage } from '@/lib/storage';

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
];

type AnalyticsCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
};

type AnalyticsSection = {
  title: string;
  data: BarDatum[];
  barColor: string;
};

type RoleAnalyticsScreenProps = {
  testID: string;
  title: string;
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
  onBack: () => void;
  cards: AnalyticsCard[];
  primarySection?: AnalyticsSection;
  secondarySection?: AnalyticsSection;
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  emptyMessage: string;
  onExportCsv?: () => void;
  isExportingCsv?: boolean;
  disableExportCsv?: boolean;
  extraFilters?: RoleAnalyticsDropdownFilter[];
  suppressContent?: boolean;
};

type GlassContrastMode = 'balanced' | 'high';
const ANALYTICS_GLASS_CONTRAST_KEY = 'ANALYTICS_GLASS_CONTRAST_MODE';
type RoleAnalyticsDropdownFilter = {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

function LiquidGlassSurface({
  children,
  contentClassName,
  isDark = false,
  contrastMode = 'balanced',
}: {
  children: React.ReactNode;
  contentClassName?: string;
  isDark?: boolean;
  contrastMode?: GlassContrastMode;
}) {
  return (
    <RNView
      style={[
        styles.glassOuter,
        isDark ? styles.glassOuterDark : styles.glassOuterLight,
        contrastMode === 'high' ? (isDark ? styles.glassOuterDarkHigh : styles.glassOuterLightHigh) : null,
      ]}
    >
      <RNView pointerEvents="none" style={[styles.glassTopLight, isDark ? styles.glassTopLightDark : styles.glassTopLightLight]} />
      <RNView
        pointerEvents="none"
        style={[
          styles.glassSpecularEdge,
          isDark ? styles.glassSpecularEdgeDark : styles.glassSpecularEdgeLight,
          contrastMode === 'high' ? (isDark ? styles.glassSpecularEdgeDarkHigh : styles.glassSpecularEdgeLightHigh) : null,
        ]}
      />
      <RNView pointerEvents="none" style={[styles.glassInnerShadow, isDark ? styles.glassInnerShadowDark : styles.glassInnerShadowLight]} />
      <RNView pointerEvents="none" style={[styles.glassBottomDepth, isDark ? styles.glassBottomDepthDark : styles.glassBottomDepthLight]} />
      <RNView pointerEvents="none" style={[styles.glassCoolRefractionBlob, isDark ? styles.glassCoolRefractionBlobDark : styles.glassCoolRefractionBlobLight]} />
      <RNView pointerEvents="none" style={[styles.glassRefractionBlob, isDark ? styles.glassRefractionBlobDark : styles.glassRefractionBlobLight]} />
      <View className={contentClassName}>{children}</View>
    </RNView>
  );
}

function RangePicker({
  value,
  onChange,
  isDark = false,
  contrastMode = 'balanced',
}: {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
  isDark?: boolean;
  contrastMode?: GlassContrastMode;
}) {
  const modal = useModal();
  const selectedRange = React.useMemo(
    () => RANGES.find(range => range.value === value)?.label ?? value.toUpperCase(),
    [value],
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select analytics range. Current range ${selectedRange}`}
        className="size-9 items-center justify-center rounded-full"
        style={[
          styles.glassControlButton,
          isDark ? styles.glassControlButtonDark : styles.glassControlButtonLight,
          contrastMode === 'high' ? (isDark ? styles.glassControlButtonDarkHigh : styles.glassControlButtonLightHigh) : null,
        ]}
        onPress={modal.present}
      >
        <RangeFilterBubbleIcon isDark={isDark} />
      </Pressable>
      <Options
        ref={modal.ref}
        options={RANGES.map(range => ({ label: range.label, value: range.value }))}
        value={value}
        onSelect={(option) => {
          onChange(option.value as AnalyticsRange);
          modal.dismiss();
        }}
      />
    </>
  );
}

function HeaderFilterPicker({
  filter,
  isDark = false,
  contrastMode = 'balanced',
}: {
  filter: RoleAnalyticsDropdownFilter;
  isDark?: boolean;
  contrastMode?: GlassContrastMode;
}) {
  const modal = useModal();
  const selectedLabel = React.useMemo(
    () => filter.options.find(option => option.value === filter.value)?.label ?? filter.label,
    [filter.label, filter.options, filter.value],
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${filter.label} filter. Current ${selectedLabel}`}
        onPress={modal.present}
        className="rounded-lg px-2 py-1"
        style={[
          styles.glassControlButton,
          isDark ? styles.glassControlButtonDark : styles.glassControlButtonLight,
          contrastMode === 'high' ? (isDark ? styles.glassControlButtonDarkHigh : styles.glassControlButtonLightHigh) : null,
        ]}
      >
        <Text className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
          {`${filter.label}: ${selectedLabel}`}
        </Text>
      </Pressable>
      <Options
        ref={modal.ref}
        value={filter.value}
        options={filter.options}
        onSelect={(option) => {
          filter.onChange(option.value as string);
          modal.dismiss();
        }}
      />
    </>
  );
}

function RangeFilterBubbleIcon({ isDark = false }: { isDark?: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 4.5H13M3 8H13M3 11.5H13"
        stroke={isDark ? '#d4d4d8' : '#737373'}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={6} cy={4.5} r={1.7} fill={isDark ? '#fb923c' : '#FF6C00'} />
      <Circle cx={10.5} cy={8} r={1.7} fill={isDark ? '#fb923c' : '#FF6C00'} />
      <Circle cx={7.5} cy={11.5} r={1.7} fill={isDark ? '#fb923c' : '#FF6C00'} />
    </Svg>
  );
}

function AnalyticsHeader({
  title,
  range,
  onRangeChange,
  onBack,
  onExportCsv,
  isExportingCsv = false,
  disableExportCsv = false,
  isDark = false,
  contrastMode = 'balanced',
  onToggleContrastMode,
  extraFilters = [],
}: {
  title: string;
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
  onBack: () => void;
  onExportCsv?: () => void;
  isExportingCsv?: boolean;
  disableExportCsv?: boolean;
  isDark?: boolean;
  contrastMode?: GlassContrastMode;
  onToggleContrastMode: () => void;
  extraFilters?: RoleAnalyticsDropdownFilter[];
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between px-4 pb-3">
        <View className="flex-row items-center gap-2">
          <RiveBackButton onPress={onBack} />
          <View className="gap-0.5">
            <AppLogo size="sm" showText />
            <Text className="text-xs font-medium tracking-wider text-neutral-400 uppercase">
              {title}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {onExportCsv
            ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Export reports as CSV"
                  disabled={isExportingCsv || disableExportCsv}
                  onPress={onExportCsv}
                  className="flex-row items-center gap-1 rounded-lg px-2 py-1.5"
                  style={[
                    styles.glassControlButton,
                    isDark ? styles.glassControlButtonDark : styles.glassControlButtonLight,
                    contrastMode === 'high' ? (isDark ? styles.glassControlButtonDarkHigh : styles.glassControlButtonLightHigh) : null,
                    isExportingCsv || disableExportCsv
                      ? styles.glassControlButtonDisabled
                      : isDark
                        ? styles.glassControlButtonActiveDark
                        : styles.glassControlButtonActiveLight,
                  ]}
                >
                  <ShareIcon width={14} height={14} />
                  <Text className="text-xs font-semibold text-primary dark:text-primary-300">
                    {isExportingCsv ? 'Exporting...' : 'Export CSV'}
                  </Text>
                </Pressable>
              )
            : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Switch glass contrast. Currently ${contrastMode}`}
            onPress={onToggleContrastMode}
            className="rounded-lg px-2 py-1"
            style={[
              styles.glassControlButton,
              isDark ? styles.glassControlButtonDark : styles.glassControlButtonLight,
              contrastMode === 'high' ? (isDark ? styles.glassControlButtonDarkHigh : styles.glassControlButtonLightHigh) : null,
            ]}
          >
            <Text className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-200">
              {contrastMode === 'high' ? 'High' : 'Balanced'}
            </Text>
          </Pressable>
          <RangePicker value={range} onChange={onRangeChange} isDark={isDark} contrastMode={contrastMode} />
          <ThemeToggle />
        </View>
      </View>
      {extraFilters.length > 0
        ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
            >
              {extraFilters.map(filter => (
                <HeaderFilterPicker
                  key={filter.id}
                  filter={filter}
                  isDark={isDark}
                  contrastMode={contrastMode}
                />
              ))}
            </ScrollView>
          )
        : null}
    </View>
  );
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  valueColor,
  isDark = false,
  contrastMode = 'balanced',
}: AnalyticsCard & { isDark?: boolean; contrastMode?: GlassContrastMode }) {
  return (
    <LiquidGlassSurface contentClassName="flex-1 p-3" isDark={isDark} contrastMode={contrastMode}>
      <View className={`mb-2 size-7 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </View>
      <Text className={`text-lg font-bold text-neutral-900 dark:text-neutral-100 ${valueColor ?? ''}`}>{value}</Text>
      <Text className="text-[10px] font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        {label}
      </Text>
    </LiquidGlassSurface>
  );
}

function KpiGrid({
  cards,
  isDark = false,
  contrastMode = 'balanced',
}: {
  cards: AnalyticsCard[];
  isDark?: boolean;
  contrastMode?: GlassContrastMode;
}) {
  const rows = Array.from({ length: Math.ceil(cards.length / 2) }, (_, index) => cards.slice(index * 2, index * 2 + 2));

  return (
    <View className="gap-3">
      {rows.map(row => (
        <View key={row.map(card => card.label).join('-')} className="flex-row gap-3">
          {row.map(card => (
            <KpiCard key={card.label} {...card} isDark={isDark} contrastMode={contrastMode} />
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionCard({
  title,
  children,
  isDark = false,
  contrastMode = 'balanced',
}: {
  title: string;
  children: React.ReactNode;
  isDark?: boolean;
  contrastMode?: GlassContrastMode;
}) {
  return (
    <View className="mt-4">
      <LiquidGlassSurface contentClassName="p-4" isDark={isDark} contrastMode={contrastMode}>
        <Text className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
        {children}
      </LiquidGlassSurface>
    </View>
  );
}

export function RoleAnalyticsScreen({
  testID,
  title,
  range,
  onRangeChange,
  onBack,
  cards,
  primarySection,
  secondarySection,
  isLoading,
  isError,
  hasData,
  emptyMessage,
  onExportCsv,
  isExportingCsv,
  disableExportCsv,
  extraFilters,
  suppressContent = false,
}: RoleAnalyticsScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [storedContrastMode, setStoredContrastMode] = useMMKVString(ANALYTICS_GLASS_CONTRAST_KEY, storage);
  const contrastMode: GlassContrastMode = storedContrastMode === 'high' ? 'high' : 'balanced';
  const activeRangeLabel = React.useMemo(
    () => RANGES.find(item => item.value === range)?.label ?? range.toUpperCase(),
    [range],
  );

  return (
    <View
      testID={testID}
      className={
        isDark
          ? contrastMode === 'high'
            ? 'flex-1 bg-[#020617]'
            : 'flex-1 bg-[#0b1220]'
          : contrastMode === 'high'
            ? 'flex-1 bg-[#e2e8f0]'
            : 'flex-1 bg-[#edf2ff]'
      }
    >
      <AnalyticsHeader
        title={title}
        range={range}
        onRangeChange={onRangeChange}
        onBack={onBack}
        onExportCsv={onExportCsv}
        isExportingCsv={isExportingCsv}
        disableExportCsv={disableExportCsv}
        isDark={isDark}
        contrastMode={contrastMode}
        onToggleContrastMode={() => {
          const nextMode: GlassContrastMode = contrastMode === 'balanced' ? 'high' : 'balanced';
          setStoredContrastMode(nextMode);
        }}
        extraFilters={extraFilters}
      />
      {isLoading && !suppressContent && (
        <View className="flex-1 items-center justify-center">
          <ListPaginationAnimation size={100} />
        </View>
      )}
      {isError && !suppressContent && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Couldn't load analytics right now. Please try again.
          </Text>
        </View>
      )}
      {!isLoading && !isError && !suppressContent && (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 18 }} showsVerticalScrollIndicator={false}>
          {hasData
            ? (
                <>
                  <KpiGrid cards={cards} isDark={isDark} contrastMode={contrastMode} />
                  {primarySection && primarySection.data.length > 0 && (
                    <SectionCard title={primarySection.title} isDark={isDark} contrastMode={contrastMode}>
                      <HorizontalBarChart data={primarySection.data} barColor={primarySection.barColor} />
                    </SectionCard>
                  )}
                  {secondarySection && secondarySection.data.length > 0 && (
                    <SectionCard title={secondarySection.title} isDark={isDark} contrastMode={contrastMode}>
                      <HorizontalBarChart data={secondarySection.data} barColor={secondarySection.barColor} />
                    </SectionCard>
                  )}
                </>
              )
            : (
                <View className="items-center">
                  <EmptyStateWithAnimation
                    key={`${testID}-empty-${range}`}
                    source={lottieAssets.adminEmptySearch}
                    message={emptyMessage}
                    testID={`${testID}-empty`}
                    {...emptyStatePresets.adminAnalytics}
                  />
                  <Text className="mt-2 text-xs font-medium text-neutral-400">
                    {`Showing ${activeRangeLabel} range`}
                  </Text>
                </View>
              )}
        </ScrollView>
      )}
      {suppressContent && <View className="flex-1" />}
    </View>
  );
}

const styles = StyleSheet.create({
  glassOuter: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
  },
  glassOuterLight: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.32)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 7,
  },
  glassOuterDark: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    backgroundColor: 'rgba(15,23,42,0.88)',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.44,
    shadowRadius: 22,
    elevation: 8,
  },
  glassOuterLightHigh: {
    borderColor: 'rgba(71,85,105,0.38)',
    backgroundColor: 'rgba(255,255,255,0.97)',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  glassOuterDarkHigh: {
    borderColor: 'rgba(148,163,184,0.44)',
    backgroundColor: 'rgba(15,23,42,0.95)',
    shadowOpacity: 0.62,
    shadowRadius: 28,
    elevation: 11,
  },
  glassTopLight: {
    position: 'absolute',
    top: -12,
    left: 8,
    right: 8,
    height: 44,
    borderRadius: 26,
  },
  glassTopLightLight: {
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  glassTopLightDark: {
    backgroundColor: 'rgba(226,232,240,0.12)',
  },
  glassSpecularEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  glassSpecularEdgeLight: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  glassSpecularEdgeDark: {
    backgroundColor: 'rgba(226,232,240,0.42)',
  },
  glassSpecularEdgeLightHigh: {
    backgroundColor: 'rgba(255,255,255,1)',
  },
  glassSpecularEdgeDarkHigh: {
    backgroundColor: 'rgba(226,232,240,0.58)',
  },
  glassInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
  },
  glassInnerShadowLight: {
    backgroundColor: 'rgba(15,23,42,0.09)',
  },
  glassInnerShadowDark: {
    backgroundColor: 'rgba(15,23,42,0.26)',
  },
  glassBottomDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
  },
  glassBottomDepthLight: {
    backgroundColor: 'rgba(100,116,139,0.1)',
  },
  glassBottomDepthDark: {
    backgroundColor: 'rgba(148,163,184,0.14)',
  },
  glassCoolRefractionBlob: {
    position: 'absolute',
    left: -22,
    top: -18,
    width: 96,
    height: 96,
    borderRadius: 52,
  },
  glassCoolRefractionBlobLight: {
    backgroundColor: 'rgba(129,140,248,0.18)',
  },
  glassCoolRefractionBlobDark: {
    backgroundColor: 'rgba(99,102,241,0.22)',
  },
  glassRefractionBlob: {
    position: 'absolute',
    right: -22,
    bottom: -28,
    width: 94,
    height: 94,
    borderRadius: 50,
  },
  glassRefractionBlobLight: {
    backgroundColor: 'rgba(255,190,153,0.28)',
  },
  glassRefractionBlobDark: {
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  glassControlButton: {
    borderWidth: 1,
  },
  glassControlButtonLight: {
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  glassControlButtonDark: {
    borderColor: 'rgba(148,163,184,0.38)',
    backgroundColor: 'rgba(30,41,59,0.94)',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 13,
    elevation: 6,
  },
  glassControlButtonLightHigh: {
    borderColor: 'rgba(71,85,105,0.42)',
    backgroundColor: 'rgba(255,255,255,1)',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 7,
  },
  glassControlButtonDarkHigh: {
    borderColor: 'rgba(148,163,184,0.5)',
    backgroundColor: 'rgba(30,41,59,1)',
    shadowOpacity: 0.62,
    shadowRadius: 16,
    elevation: 8,
  },
  glassControlButtonActiveLight: {
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  glassControlButtonActiveDark: {
    backgroundColor: 'rgba(30,41,59,0.98)',
  },
  glassControlButtonDisabled: {
    opacity: 0.58,
  },
});

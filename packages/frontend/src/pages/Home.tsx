/**
 * Home page - Displays combined availability view for all favorite pools
 * 007-favorites-combined-view
 *
 * T017: Integrate useCombinedFavoritesData hook
 * T018: Render CombinedSlotSection components
 * T019: Handle empty favorites state
 * T020: Add loading and error states display
 * T021-T023: Multi-slot forward view integration
 * T024-T026: View toggle integration
 * T027-T032: Time slot navigation integration
 * T033-T034: Duration adjustment integration
 * T035: Focusable container
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CombinedSlotSection } from '../components/CombinedSlotSection';
import { SlotNavigationButtons } from '../components/SlotNavigationButtons';
import { EdgeZoneOverlay } from '../components/EdgeZoneOverlay';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { KeyboardHints } from '../components/KeyboardHints';
import { useTimeSlotState } from '../hooks/useTimeSlotState';
import { useViewPreferences } from '../hooks/useViewPreferences';
import { useSlotNavigation } from '../hooks/useSlotNavigation';
import { useCombinedFavoritesData } from '../hooks/useCombinedFavoritesData';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  } as React.CSSProperties,
  section: {
    marginBottom: '32px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    color: '#666',
  } as React.CSSProperties,
  emptyStateText: {
    marginBottom: '16px',
  } as React.CSSProperties,
  link: {
    color: '#0066cc',
    textDecoration: 'none',
  } as React.CSSProperties,
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  } as React.CSSProperties,
  error: {
    padding: '16px',
    backgroundColor: '#ffeaea',
    border: '1px solid #f44336',
    borderRadius: '8px',
    color: '#c62828',
    marginBottom: '16px',
  } as React.CSSProperties,
  // T035: Focusable container
  combinedViewContainer: {
    outline: 'none',
  } as React.CSSProperties,
  combinedViewContainerFocused: {
    outline: '2px solid #0066cc',
    outlineOffset: '2px',
    borderRadius: '8px',
  } as React.CSSProperties,
  // View options styles
  viewOptionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  viewToggleButton: {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  viewToggleButtonActive: {
    backgroundColor: '#0066cc',
    color: '#fff',
    borderColor: '#0066cc',
  } as React.CSSProperties,
  viewToggleButtonInactive: {
    backgroundColor: '#fff',
    color: '#333',
  } as React.CSSProperties,
  viewToggleLabel: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  // Forward slot count selector
  forwardSlotSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
  } as React.CSSProperties,
  forwardSlotSelect: {
    padding: '4px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  } as React.CSSProperties,
  // Refresh button
  refreshButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  refreshButtonDisabled: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  } as React.CSSProperties,
  refreshingIndicator: {
    fontSize: '14px',
    color: '#0066cc',
  } as React.CSSProperties,
  slotsContainer: {
    marginTop: '16px',
  } as React.CSSProperties,
};

export function Home() {
  const [hasFocus, setHasFocus] = useState(false);

  // T021/T024: View preferences for compact toggle and forward slot count
  const viewPreferences = useViewPreferences();

  // T027: Time slot state management
  const timeSlotState = useTimeSlotState();
  const { state, setDate, setStartTime, setEndTime, handleNavigation, isInitialized } = timeSlotState;

  // T028: Slot navigation hook for keyboard and button controls
  const navigation = useSlotNavigation({
    startTime: state.startTime,
    duration: state.duration,
    onNavigate: handleNavigation,
  });

  // T017: Integrate useCombinedFavoritesData hook
  const combinedData = useCombinedFavoritesData({
    date: state.date,
    startTime: state.startTime,
    duration: state.duration,
    forwardSlotCount: viewPreferences.forwardSlotCount,
  });

  // T030: Keyboard event handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      navigation.handleKeyDown(e);
    },
    [navigation]
  );

  const isLoading = combinedData.isLoadingFavorites || combinedData.isLoadingAvailability;

  // T019: Handle empty favorites state
  if (!combinedData.isLoadingFavorites && combinedData.isEmpty) {
    return (
      <div style={styles.container}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>★</span> Your Favorite Pools
          </h2>
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText as React.CSSProperties}>
              You haven't added any favorite pools yet.
            </p>
            <Link to="/search" style={styles.link}>
              Search for pools to add to your favorites →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // T020: Loading state
  if (combinedData.isLoadingFavorites && !isInitialized) {
    return <div style={styles.loading as React.CSSProperties}>Loading favorites...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span>★</span> Your Favorite Pools
        </h2>

        {/* T020: Error state */}
        {combinedData.favoritesError && (
          <div style={styles.error}>{combinedData.favoritesError}</div>
        )}

        {/* T031: Time slot picker for date/time selection */}
        <TimeSlotPicker
          date={state.date}
          startTime={state.startTime}
          endTime={state.endTime}
          onDateChange={setDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          disabled={isLoading}
        />

        {/* T035: Focusable container with keyboard navigation */}
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
          style={{
            ...styles.combinedViewContainer,
            ...(hasFocus ? styles.combinedViewContainerFocused : {}),
          }}
        >
          {/* T029: Slot navigation buttons */}
          <SlotNavigationButtons
            startTime={navigation.startTime}
            endTime={navigation.endTime}
            duration={navigation.duration}
            canNavigatePrevious={navigation.canNavigatePrevious}
            canNavigateNext={navigation.canNavigateNext}
            canExtend={navigation.canExtend}
            canReduce={navigation.canReduce}
            onNavigatePrevious={navigation.navigatePrevious}
            onNavigateNext={navigation.navigateNext}
            onExtend={navigation.extendDuration}
            onReduce={navigation.reduceDuration}
            showKeyboardHints={false}
          />

          {/* T032: Keyboard hints */}
          <KeyboardHints />
        </div>

        {/* Actions row with refresh button */}
        <div style={styles.actionsRow}>
          <button
            onClick={combinedData.refresh}
            style={isLoading ? styles.refreshButtonDisabled : styles.refreshButton}
            disabled={isLoading}
          >
            Refresh
          </button>
          {combinedData.isLoadingAvailability && (
            <span style={styles.refreshingIndicator}>Updating...</span>
          )}
        </div>

        {/* T024-T026: View options with compact/detailed toggle and slots ahead selector */}
        <div style={styles.viewOptionsContainer as React.CSSProperties}>
          <div style={styles.viewToggle}>
            <span style={styles.viewToggleLabel}>View:</span>
            <button
              style={{
                ...styles.viewToggleButton,
                ...(viewPreferences.compactViewEnabled
                  ? styles.viewToggleButtonActive
                  : styles.viewToggleButtonInactive),
              }}
              onClick={() => viewPreferences.setCompactViewEnabled(true)}
            >
              Compact
            </button>
            <button
              style={{
                ...styles.viewToggleButton,
                ...(!viewPreferences.compactViewEnabled
                  ? styles.viewToggleButtonActive
                  : styles.viewToggleButtonInactive),
              }}
              onClick={() => viewPreferences.setCompactViewEnabled(false)}
            >
              Detailed
            </button>
          </div>

          {/* T022: Forward slot count selector */}
          <div style={styles.forwardSlotSelector}>
            <span style={styles.viewToggleLabel}>Slots ahead:</span>
            <select
              style={styles.forwardSlotSelect}
              value={viewPreferences.forwardSlotCount}
              onChange={(e) =>
                viewPreferences.setForwardSlotCount(parseInt(e.target.value, 10))
              }
              disabled={viewPreferences.isLoading || viewPreferences.isSaving}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {viewPreferences.isSaving && (
              <span style={{ fontSize: '12px', color: '#666' }}>Saving...</span>
            )}
          </div>
        </div>

        {/* T018: Render CombinedSlotSection components for each slot */}
        <EdgeZoneOverlay
          onNavigatePrevious={navigation.navigatePrevious}
          onNavigateNext={navigation.navigateNext}
          onExtend={navigation.extendDuration}
          onReduce={navigation.reduceDuration}
          canNavigatePrevious={navigation.canNavigatePrevious}
          canNavigateNext={navigation.canNavigateNext}
          canExtend={navigation.canExtend}
          canReduce={navigation.canReduce}
        >
          <div style={styles.slotsContainer}>
            {combinedData.slots.map((slot) => (
              <CombinedSlotSection
                key={`${slot.startTime}-${slot.endTime}`}
                slot={slot}
                compactView={viewPreferences.compactViewEnabled}
              />
            ))}
          </div>
        </EdgeZoneOverlay>
      </div>

      <div style={styles.section}>
        <Link to="/search" style={styles.link}>
          Browse all pools →
        </Link>
      </div>
    </div>
  );
}

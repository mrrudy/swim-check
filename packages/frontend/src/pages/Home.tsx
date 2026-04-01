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

import { Link } from 'react-router-dom';
import { CombinedSlotSection } from '../components/CombinedSlotSection';
import { NavigableSlotDisplay } from '../components/NavigableSlotDisplay';
import { ViewOptionsBar } from '../components/ViewOptionsBar';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
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
  // T021/T024: View preferences for compact toggle and forward slot count
  const viewPreferences = useViewPreferences();

  // T027: Time slot state management
  const timeSlotState = useTimeSlotState({
    defaultDuration: viewPreferences.isLoading ? undefined : viewPreferences.slotDurationMins,
  });
  const { state, setDate, setStartTime, setEndTime, handleNavigation, isInitialized } = timeSlotState;

  // T028: Slot navigation hook for keyboard and button controls (with cross-day support)
  const navigation = useSlotNavigation({
    startTime: state.startTime,
    duration: state.duration,
    forwardSlotCount: viewPreferences.forwardSlotCount,
    onNavigate: handleNavigation,
    date: state.date,
    onDateChange: setDate,
  });

  // T017: Integrate useCombinedFavoritesData hook
  const combinedData = useCombinedFavoritesData({
    date: state.date,
    startTime: state.startTime,
    duration: state.duration,
    forwardSlotCount: viewPreferences.forwardSlotCount,
  });

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

        {/* Time slot picker for date/time selection */}
        <TimeSlotPicker
          date={state.date}
          startTime={state.startTime}
          endTime={state.endTime}
          onDateChange={setDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          disabled={isLoading}
        />

        {/* Slot navigation + edge zone overlay (shared component) */}
        <NavigableSlotDisplay
          navigation={navigation}
          dataLoaded={!combinedData.isLoadingAvailability && combinedData.slots.length > 0}
          showKeyboardHints={false}
          showNav={viewPreferences.showNavEnabled}
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
        </NavigableSlotDisplay>

        {/* View Options */}
        <ViewOptionsBar viewPreferences={viewPreferences} />

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

        {/* Error state */}
        {combinedData.favoritesError && (
          <div style={styles.error}>{combinedData.favoritesError}</div>
        )}
      </div>

      <div style={styles.section}>
        <Link to="/search" style={styles.link}>
          Browse all pools →
        </Link>
      </div>
    </div>
  );
}

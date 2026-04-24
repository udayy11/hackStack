/**
 * Status Badge — color-coded status indicator.
 */
export default function StatusBadge({ status }) {
  const styles = {
    in_transit: 'bg-blue/15 text-blue border-blue/30',
    pending: 'bg-amber/15 text-amber border-amber/30',
    delivered: 'bg-green/15 text-green border-green/30',
    delayed: 'bg-red/15 text-red border-red/30',
    rerouted: 'bg-purple/15 text-purple border-purple/30',
    cancelled: 'bg-red/15 text-red border-red/30',
    // Alert severities
    info: 'bg-blue/15 text-blue border-blue/30',
    warning: 'bg-amber/15 text-amber border-amber/30',
    critical: 'bg-red/15 text-red border-red/30',
    // Risk levels
    low: 'bg-green/15 text-green border-green/30',
    medium: 'bg-amber/15 text-amber border-amber/30',
    high: 'bg-red/15 text-red border-red/30',
  };

  const label = (status || '').replace(/_/g, ' ');

  return (
    <span className={`status-badge border ${styles[status] || styles.info}`}>
      {label}
    </span>
  );
}

import { Card, Metric, Text, BadgeDelta, Flex, ProgressBar } from '@tremor/react';
import { useEffect, useState } from 'react';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'increase' | 'moderateIncrease' | 'unchanged' | 'moderateDecrease' | 'decrease';
  progress?: number;
  helper?: string;
}

export default function TremorCard({ label, value, delta, deltaType, progress, helper }: Props) {
  // Mounted guard: SSR-safe placeholder for client:visible. Tremor itself is
  // SSR-safe, but the guard lets us defer hydration uniformly across the
  // chart family without behavior surprises.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: 88 }} className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900" />;

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Text>{label}</Text>
          <Metric>{value}</Metric>
        </div>
        {delta && <BadgeDelta deltaType={deltaType ?? 'increase'}>{delta}</BadgeDelta>}
      </Flex>
      {progress !== undefined && (
        <>
          <Flex className="mt-4">
            <Text className="truncate">{helper ?? `${progress}%`}</Text>
          </Flex>
          <ProgressBar value={progress} className="mt-2" color="red" />
        </>
      )}
    </Card>
  );
}

import { Card, Metric, Text, BadgeDelta, Flex, ProgressBar } from '@tremor/react';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'increase' | 'moderateIncrease' | 'unchanged' | 'moderateDecrease' | 'decrease';
  progress?: number;
  helper?: string;
}

export default function TremorCard({ label, value, delta, deltaType, progress, helper }: Props) {
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

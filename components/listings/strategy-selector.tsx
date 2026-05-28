'use client'

import type { JSX } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STRATEGIES, STRATEGY_SLUGS, type StrategySlug } from '@/lib/scoring/strategies'

type StrategySelectorProps = {
  value: StrategySlug
  onValueChange: (value: StrategySlug) => void
  disabled?: boolean
}

export function StrategySelector({
  value,
  onValueChange,
  disabled = false,
}: StrategySelectorProps): JSX.Element {
  return (
    <div className="space-y-2">
      <Label>Estratégia</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as StrategySlug)}
        disabled={disabled}
      >
        <SelectTrigger aria-label="Estratégia">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STRATEGY_SLUGS.map((slug) => (
            <SelectItem key={slug} value={slug}>
              {STRATEGIES[slug].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

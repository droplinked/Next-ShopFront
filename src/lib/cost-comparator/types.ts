/**
 * Cost-comparator wire types — mirror the DTO shapes shipped in
 * droplinked-backend PR #1450 (`src/modules/cost-comparator/dto/*`).
 *
 * Keep this file in lockstep with that backend module. Any drift will
 * surface at runtime as undefined fields in the calculator UI.
 */

export type SupportedNetwork = 'awin' | 'rakuten' | 'impact';

export interface CalculateInput {
  currentNetwork: SupportedNetwork;
  annualSpendUsd: number;
  avgCommissionRate?: number;
  monthlyTxCount?: number;
  merchantEmail?: string;
  merchantName?: string;
}

export interface MonthlyProjectionCell {
  month: number;
  cumulativeSavingsUsd: number;
  currentNetworkCostUsd: number;
  droplinkedCostUsd: number;
}

export interface PayoutSpeedComparison {
  currentDays: number;
  droplinkedDays: number;
  speedMultiplier: number;
}

export interface CalculateOutput {
  currentNetwork: SupportedNetwork;
  annualSpendUsd: number;
  avgCommissionRate: number;
  networkTakeRate: number;
  droplinkedFeeRate: number;
  networkFeeAnnualUsd: number;
  droplinkedFeeAnnualUsd: number;
  currentTotalAnnualUsd: number;
  droplinkedTotalAnnualUsd: number;
  savingsAnnualUsd: number;
  savings3YearUsd: number;
  payoutSpeedComparison: PayoutSpeedComparison;
  projectionMonthly: MonthlyProjectionCell[];
  calculatedAt: string;
}

export interface LeadCaptureInput {
  merchantEmail: string;
  merchantName: string;
  calcInput: CalculateInput;
  verticalHint?: string;
  utmSource?: string;
  notes?: string;
}

export interface LeadCaptureResponse {
  _id: string;
  merchantEmail: string;
  merchantName: string;
  savingsAnnualUsd: number;
  status: string;
  createdAt?: string;
}

export interface ApiErrorPayload {
  error: string;
}

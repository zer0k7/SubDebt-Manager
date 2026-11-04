export interface SplitFriendItem {
  id: string;
  name: string;
  amount: string;
}

export interface BankDeductionBreakdown {
  totalBill: number;
  friendsOwedSum: number;
  userNetShare: number;
  defaultDeductionAmount: number;
  canChooseSplitDeduction: boolean;
  projectedBalanceAfterDefault: number;
  isOverdraftAfterDefault: number | boolean;
}

export const calculateDeductionBreakdown = (
  rawAmount: string | number,
  currentBalance: number,
  isSplitEnabled: boolean,
  splitFriends: SplitFriendItem[] = []
): BankDeductionBreakdown => {
  const totalBill = typeof rawAmount === 'number' ? Math.max(0, rawAmount) : Math.max(0, parseFloat(rawAmount) || 0);

  const friendsOwedSum = isSplitEnabled
    ? splitFriends.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0)
    : 0;

  const userNetShare = isSplitEnabled
    ? Math.max(0, parseFloat((totalBill - friendsOwedSum).toFixed(2)))
    : totalBill;

  const canChooseSplitDeduction = isSplitEnabled && friendsOwedSum > 0 && userNetShare < totalBill;

  const defaultDeductionAmount = totalBill;

  const projectedBalanceAfterDefault = parseFloat((currentBalance - defaultDeductionAmount).toFixed(2));
  const isOverdraftAfterDefault = projectedBalanceAfterDefault < 0;

  return {
    totalBill,
    friendsOwedSum,
    userNetShare,
    defaultDeductionAmount,
    canChooseSplitDeduction,
    projectedBalanceAfterDefault,
    isOverdraftAfterDefault,
  };
};

export const calculateProjectedBalance = (currentBalance: number, deductionAmount: number): number => {
  return parseFloat((currentBalance - deductionAmount).toFixed(2));
};

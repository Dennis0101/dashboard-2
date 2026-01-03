export type BinanceApiRestrictions = {
  // https://binance-docs.github.io/apidocs/spot/en/#get-api-key-permission-user_data
  enableWithdrawals: boolean;
  enableInternalTransfer: boolean;
  enableFastWithdrawSwitch: boolean;
  enableVanillaOptions: boolean;
  enableReading: boolean;
  enableSpotAndMarginTrading: boolean;
  enableFutures: boolean;
  enableMargin: boolean;
  ipRestrict: boolean;
  permitsUniversalTransfer: boolean;
  // additional fields may exist; keep unknowns tolerant
  [k: string]: unknown;
};

export type BinanceFuturesAccount = {
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  totalInitialMargin: string;
  totalMaintMargin: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  assets?: unknown[];
  positions?: unknown[];
  [k: string]: unknown;
};

export type BinanceFuturesPositionRisk = {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  positionSide: string; // BOTH/LONG/SHORT
  notional: string;
  updateTime: number;
  [k: string]: unknown;
};

export type BinanceFuturesOrderResponse = {
  orderId: number;
  symbol: string;
  status: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cumQty: string;
  cumQuote: string;
  timeInForce: string;
  type: string;
  side: string;
  updateTime: number;
  [k: string]: unknown;
};


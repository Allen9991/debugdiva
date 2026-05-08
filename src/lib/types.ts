export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: "labour" | "material";
};

export type Job = {
  id: string;
  title: string;
};

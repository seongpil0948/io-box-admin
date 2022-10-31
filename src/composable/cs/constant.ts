export const FAQ_CATEGORIES: {
  [k: string]: {
    label: string;
    value: string;
  }[];
} = {
  SHOP: [
    {
      label: "주문",
      value: "order",
    },
    {
      label: "결제",
      value: "payment",
    },
    {
      label: "상품",
      value: "product",
    },
    {
      label: "메뉴얼",
      value: "menu",
    },
    {
      label: "인아웃배송",
      value: "io-ship",
    },
  ],
  VENDOR: [
    {
      label: "주문",
      value: "order",
    },
    {
      label: "결제",
      value: "payment",
    },
    {
      label: "상품",
      value: "product",
    },
    {
      label: "메뉴얼",
      value: "menu",
    },
    {
      label: "인아웃배송",
      value: "io-ship",
    },
  ],
  UNCLE: [
    {
      label: "픽업",
      value: "order",
    },
    {
      label: "결제",
      value: "payment",
    },
    {
      label: "근로자 관리",
      value: "product",
    },

    {
      label: "광고설정",
      value: "io-ship",
    },
    {
      label: "메뉴얼",
      value: "menu",
    },
  ],
};

export const postTypeOpt = [
  {
    label: "FAQ",
    value: "FAQ",
  },
  {
    label: "공지",
    value: "NOTICE",
  },
  {
    label: "이벤트",
    value: "EVENT",
  },
];

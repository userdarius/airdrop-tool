export type SalesField = {
  isActive: boolean;
  id: {
    id: string;
  };
  max_mints: string[];
  prices: string[];
  start_times: string[];
  total_quantity: string;
};

export type SalesContent = {
  dataType: string;
  fields: SalesField;
  hasPublicTransfer: boolean;
  type: string;
};

export type ContentFields = {
  nfts: {
    fields: {
      contents: {
        fields: {
          size: string;
        };
      };
    };
  };
};

export type ContentData = {
  dataType: string;
  fields: ContentFields;
  hasPublicTransfer: boolean;
  type: string;
};

export const format = {
  Date: 'YYYY-MM-DD',
  MonthDate: 'MM/DD',
} as const;

const StringUtility = {
  // ex.. PARAM: 10000(pay想定), RET: '10000' or '+10000'
  ConvertIntToShowStr: (payedPrice: number) => {
    if (payedPrice >= 0) return payedPrice.toLocaleString();
    else return '+' + (payedPrice * -1).toLocaleString();
  },
  // ex.. PARAM: 10000(pay想定), RET: '-10000' or '+10000'
  ConvertIntToShowPrefixStr: (payedPrice: number) => {
    if (payedPrice === 0) return '0';
    else if (payedPrice > 0) return '-' + payedPrice.toLocaleString();
    else return '+' + (payedPrice * -1).toLocaleString();
  },
  // ex.. PARAM: (10000, isPay), RET: '10000' or '+10000'
  ConvertIntToShowStrWithIsPay: (payedPrice: number, isPay: boolean) => {
    if (payedPrice === 0) return '0';
    else if (isPay) return payedPrice.toLocaleString();
    else return '+' + payedPrice.toLocaleString();
  },
  // ex.. PARAM: '08', RET: '8'
  ConvertSuppressZero: (month: string) => {
    return month.replace(/^0+/, '');
  },
  typeAndSubtype(type_name: string, sub_type_name: string | null) {
    if (sub_type_name) {
      return type_name + ' ー ' + sub_type_name;
    } else {
      return type_name;
    }
  },
  autoLink(text: string): string {
    return (text ?? '').replace(/(https?:\/\/[^\s]*)/g, "<a href='$1' target='_blank'>$1</a>");
  },
};

export default StringUtility;

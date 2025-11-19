declare module 'react-native-get-sms-android' {
  interface SmsMessage {
    _id: string;
    address: string;
    body: string;
    date: number;
    [key: string]: any;
  }

  const SmsAndroid: {
    list(
      filter: string,
      failCallback: (error: string) => void,
      successCallback: (count: number, smsList: string) => void
    ): void;
  };

  export default SmsAndroid;
}

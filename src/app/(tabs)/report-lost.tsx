import { Redirect } from 'expo-router';

// Alt menüde ortadaki düğmenin yerini tutar. Düğme bu sekmeyi açmaz, doğrudan kayıp ekranına gider.
export default function ReportLostRoute() {
  return <Redirect href="/start-lost" />;
}

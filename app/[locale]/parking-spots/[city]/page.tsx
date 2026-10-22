import { areaKindRoute } from '@/features/areas/components/area-kind-route';

const route = areaKindRoute('parking');

export const generateMetadata = route.generateMetadata;
export default route.AreaKindPage;

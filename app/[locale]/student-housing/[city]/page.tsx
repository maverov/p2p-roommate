import { areaKindRoute } from '@/features/areas/components/area-kind-route';

const route = areaKindRoute('students');

export const generateMetadata = route.generateMetadata;
export default route.AreaKindPage;

import Container from '../Container';
import { NavbarClient } from './NavbarClient';

interface NavbarProps {
  locale: string;
}

// Server component — fetch any server-side data here later (e.g. session)
export function Navbar({ locale }: NavbarProps) {
  const user = null; // swap with auth session later

  return (
    <nav aria-label="Main navigation" className="w-full sticky top-0 z-50">
      <div className="bg-white shadow-sm border-b">
        <Container>
          <NavbarClient user={user} />
        </Container>
      </div>
    </nav>
  );
}
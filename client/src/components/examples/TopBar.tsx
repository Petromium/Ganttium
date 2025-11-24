import { TopBar } from '../TopBar';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function TopBarExample() {
  return (
    <ThemeProvider>
      <TopBar />
    </ThemeProvider>
  );
}

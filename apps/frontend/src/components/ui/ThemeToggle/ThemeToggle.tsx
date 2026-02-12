'use client';

import { ColorModeButton, useColorMode } from '@/components/ui/color-mode';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { colorMode, setColorMode } = useColorMode();

  const handleChangeTheme = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ColorModeButton onClick={handleChangeTheme}>
      {colorMode === 'dark' ? <Sun /> : <Moon />}
    </ColorModeButton>
  );
}

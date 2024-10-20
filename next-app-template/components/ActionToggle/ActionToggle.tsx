import cx from 'clsx';
import { ActionIcon, useMantineColorScheme, useComputedColorScheme, Group } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import classes from './ActionToggle.module.css';

export function ActionToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <Group  style={{ margin: 0 }}>
      <ActionIcon
        onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
        variant="default"
        radius='9px'
        size="lg" // Changed from 'xl' to 'lg' for a more compact size
        aria-label="Toggle color scheme"
    // Reduce padding inside the ActionIcon for a smaller appearance
      >
        {computedColorScheme === 'light' ? (
          <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
        ) : (
          <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
        )}
      </ActionIcon>
    </Group>
  );
}

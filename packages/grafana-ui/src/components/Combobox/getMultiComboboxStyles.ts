import { css, cx } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';

import { getFocusStyles } from '../../themes/mixins';
import { getInputStyles } from '../Input/Input';

export const getMultiComboboxStyles = (theme: GrafanaTheme2, isOpen: boolean) => {
  const inputStyles = getInputStyles({ theme });
  const focusStyles = getFocusStyles(theme);

  return {
    wrapper: cx(
      inputStyles.input,
      css({
        display: 'flex',
        gap: theme.spacing(0.5),
        padding: theme.spacing(0.5),
        '&:focus-within': {
          ...focusStyles,
        },
      })
    ),
    input: css({
      border: 'none',
      outline: 'none',
      background: 'transparent',
      width: '4px',
      pointerEvents: 'none',
      flexGrow: 1,
      minWidth: '0',
      '&::placeholder': {
        color: theme.colors.text.disabled,
      },
      '&:focus': {
        outline: 'none',
      },
    }),
    pillWrapper: css({
      display: 'inline-flex',
      flexWrap: isOpen ? 'wrap' : 'nowrap',
      flexGrow: 1,
      minWidth: '50px',
      gap: theme.spacing(0.5),
    }),
    restNumber: css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(0, 1),
      borderRadius: theme.shape.radius.default,
      backgroundColor: theme.colors.background.secondary,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
    }),
  };
};

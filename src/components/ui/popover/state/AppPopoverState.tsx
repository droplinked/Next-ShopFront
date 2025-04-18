'use client';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { IAppPopoverState } from '../interface';
import { Popover } from '@mui/material';

const AppPopoverState = ({
  trigger,
  children,
  appClassName,
  anchor = { vertical: 'bottom', horizontal: 'center' },
  transform = { vertical: 'top', horizontal: 'center' },
  ...props
}: IAppPopoverState) => (
  <PopupState variant="popover" popupId="droplinked-popup-popover">
    {(popoverState) => (
      <>
        <div {...bindTrigger(popoverState)}>{trigger}</div>
        <Popover
          sx={{ '& .MuiPaper-root': { backgroundColor: 'transparent' } }}
          {...bindPopover(popoverState)}
          anchorOrigin={anchor}
          transformOrigin={transform}
          className={appClassName}
          {...props}
        >
          {children}
        </Popover>
      </>
    )}
  </PopupState>
);
export default AppPopoverState;

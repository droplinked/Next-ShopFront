import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import PopupState, { bindDialog, bindTrigger } from 'material-ui-popup-state';
import { IAppDialog } from './interface';

const AppDialog = ({ props, sx, ...dialog }: IAppDialog) => {
  return (
    <>
      <div className="self-stretch">{props.trigger}</div>
      <Dialog
        sx={sx ? sx : { '& .MuiDialog-paper': { boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.2)', backgroundColor: '#FFFFFF', width: '100%', maxWidth: '2000px', backdropFilter: 'opacity' } }}
        {...bindDialog(props.dialogState)}
        keepMounted
        {...dialog}
      >
        <DialogTitle {...props.title} />
        <DialogContent {...props.content} />
        <DialogActions {...props.actions} />
      </Dialog>
    </>
  );
};

export default AppDialog;
